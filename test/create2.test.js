const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('Create2', function () {
  let create2Factory;
  let deployer;
  const SALT = 777;

  before('deploy Create2 contract', async function () {
    [deployer] = await ethers.getSigners();
    const Create2FactoryFactory = await ethers.getContractFactory(
      'Create2Factory'
    );
    create2Factory = await Create2FactoryFactory.deploy();
    await create2Factory.deployed();

    console.log('');
    console.log('\tSALT: ', SALT);
  });

  it('should calculate its address before DeployWithCreate2 contract is created', async function () {
    const bytecode = await create2Factory.getBytecode(deployer.address);

    const calculatedAddress = await create2Factory.getAddress(bytecode, SALT);

    console.log('');
    console.log('\tCalculated Address : ', calculatedAddress);

    const deployTx = await create2Factory.deploy(SALT);
    const receipt = await deployTx.wait();

    const deployedAddress = ethers.utils.hexStripZeros(
      receipt.events[0].data,
      20
    );

    console.log('\tDeployed Addrss    : ', deployedAddress);

    expect(calculatedAddress.toLowerCase()).to.equal(
      deployedAddress.toLowerCase()
    );
  });
});
