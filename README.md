# Metamorphic Contracts

## [0] Setup

### 1) Clone repository

`$ git clone https://github.com/Frenchkebab/metamorphic-contracts.git`

### 2) Install dependencies

`$ npm install`

## [1] StrangeV4 Challenge

```solidity
pragma solidity 0.8.16;

contract StrangeV4 {
  bool check1;
  address private strangeContract;
  bytes32 private codeHash;
  uint256 private codeLength;

  constructor() payable {
    require(msg.value == 1 ether);
  }

  function initialize(address _contract) external {
    require(_contract.code.length != 0, "target must be a contract");
    codeHash = _contract.codehash;
    strangeContract = _contract;
  }

  function success(address _contract) external {
    require(_contract.code.length != 0, "must be a contract");
    require(_contract == strangeContract, "must be the same contract");
    require(_contract.codehash != codeHash, "contract isn't strange");
    uint256 bal;
    assembly {
      bal := selfbalance()
    }
    payable(msg.sender).transfer(bal);
  }
}
```

### Success Condition

- **`Condition1`**: `_contract` must be a contract
- **`Condition2`**: `_contract` must have same address as `strangeContract` (previous `_contract`)
- **`Condition3`**: `codeHash` of `_contract` must be different from `strangeContract`'s `codeHash`

> To pass require conditions in `success` success function after calling `initialize`, you must deploy a contract that has same contract address with different code

<br>

### Solution1: Using MetamorphicContractFactory by 0age

`$ npx hardhat test test/StrangeV4/StrangeV4-solution1.test.js`

Here, you use [`MetamorphicContractFactory`](https://github.com/0age/metamorphic) by **0age**.

This deploys a contract with bytecode `0x5860208158601c335a63aaf10f428752fa158151803b80938091923cf3`.

If you specify the address of its implementation when calling `deployMetamorphicContractFromExistingImplementation`,
this function will deploy a bytecode contract above and this will copy the code of the implementation contract specified.

1. Deploy **`MetamorphicContractFactory`**, **`Implementation1`** and **`Implementation2`**.

2. Deploy a metamorphic contract that has code from **`Implementation1`** as an implementation.

3. Call `initialize` with created metamorphic contract address.

4. Call `killme` and selfdestruct the metamorphic contract.

5. Redeploy a metamorphic contract with **`Implementation2`** as an implement.

6. Call `success` with the same contract address.

<br>

### Solution2: Using `create` with `create2`

`$ npx hardhat test test/StrangeV4/StrangeV4-solution2.test.js`

> Checkout [this repository](https://github.com/Frenchkebab/create2)

1. Deploy **`Factory`** contract
2. Deploy **`Parent`** from **`Factory`** using `create2`
3. Deploy **`Child1`** from **`Parent`** using `create`
4. call `initialize` with **`Child1`**'s address.
5. `selfdestruct` both **`Child1`** and **`Parent`**
6. Redeploy **`Parent`** from **`Factory`**
7. Deploy **`Child2`** from **`Parent`**.
8. Call `success` with **`Child2`**'s address.

```
                 2. create2               3. create
   1. Factory ----------------> Parent ----------------> Child1
                                  5.                       5.
```

```
                 6. create2               7. create
      Factory ----------------> Parent ----------------> Child2
```

**`Parent`** has same address when redeployed since we use same **bytecode** and **salt** for `create2`.

But how can **`Child1`** and **`Child2`** have same address?

When you use `create` there is two factors that determines the address:

1. `sender`
2. `nonce`

If you `selfdestruct` **`Parent`** contract, its `nonce` is reset to `0`.
So when you deploy **`Child2`**, it will have the very same address as when **`Child1`** was deployed.
