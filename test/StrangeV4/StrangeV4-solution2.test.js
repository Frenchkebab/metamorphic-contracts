const { expect } = require('chai');
const { ethers } = require('hardhat');

describe(`StrangeV4 Solution2: using both "create" and "create2"`, function () {
  let deployer;
  let strangeV4;
  let factory, parent, child1;
  let parentAddress, parentAddress2;
  let metamorphicContractAddress;

  before('Deploy StrangeV4 Contract', async function () {
    [deployer] = await ethers.getSigners();

    /* Deploy StrangeV4 */
    const StrangeV4 = await ethers.getContractFactory('StrangeV4', deployer);
    strangeV4 = await StrangeV4.deploy({
      value: ethers.utils.parseEther('1'),
    });
    await strangeV4.deployed();
  });

  it('Deploy Parent using "create" and Child1 using "create2"', async function () {
    /* Deploy Factory contract */
    const Factory = await ethers.getContractFactory('Factory', deployer);
    factory = await Factory.deploy();
    await factory.deployed();

    /* Deploy Parent Contract from Factory using 'create' */
    let tx = await factory.create2Parent();
    let receipt = await tx.wait();

    parentAddress = receipt.events.filter((x) => x.event === 'ParentCreated')[0]
      .args.parentAddress;

    // address of created Parent contract
    parent = await (
      await ethers.getContractFactory('Parent')
    ).attach(parentAddress);

    /* Deploy Child1 Contract from Parent using create */
    tx = await parent.createChild1();
    receipt = await tx.wait();

    // address of created metamorphic contract
    metamorphicContractAddress = receipt.events.filter(
      (x) => x.event === 'MetamorphicContract'
    )[0].args.metamorphicAddress;

    /* call initialize with created Metamorphic Contract's address */
    await (await strangeV4.initialize(metamorphicContractAddress)).wait();

    // check if metamorphicContractAddress is an instance of Child1
    const Child1 = await ethers.getContractFactory('Child1');
    child1 = Child1.attach(metamorphicContractAddress);
    expect(await child1.func1()).to.equal('Child1');
  });

  it('Destruct Parent and Child1', async function () {
    // selfdestruct Child1 Contract
    await (await child1.killme()).wait();

    // selfdestruct Parent Contract
    await (await parent.killme()).wait();

    expect(await ethers.provider.getCode(child1.address)).to.equal('0x');
    expect(await ethers.provider.getCode(parent.address)).to.equal('0x');
  });

  it('Redeploy Parent from Factory with "create2" and deploy Child2 with "create"', async function () {
    /* Redeploy Parent contract using 'create2' */
    let tx = await factory.create2Parent();
    let receipt = await tx.wait();

    parentAddress2 = receipt.events.filter(
      (x) => x.event === 'ParentCreated'
    )[0].args.parentAddress;

    // address of created Parent contract
    parent = await (
      await ethers.getContractFactory('Parent')
    ).attach(parentAddress2);

    /* Deploy Child2 contract using 'create' */
    tx = await parent.createChild2();
    receipt = await tx.wait();

    const metamorphicContractAddress2 = receipt.events.filter(
      (x) => x.event === 'MetamorphicContract'
    )[0].args.metamorphicAddress;

    expect(metamorphicContractAddress2).to.equal(metamorphicContractAddress);
  });

  it('Success', async function () {
    // balance of deployer before calling success
    const beforeBalance = await ethers.provider.getBalance(deployer.address);

    const tx = await strangeV4.success(metamorphicContractAddress);
    await tx.wait();

    const afterBalance = await ethers.provider.getBalance(deployer.address);

    expect(parseInt(afterBalance.sub(beforeBalance))).to.be.greaterThan(0);
  });
});
