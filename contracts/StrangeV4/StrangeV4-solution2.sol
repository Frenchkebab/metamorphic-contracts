// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

contract Child1 {
    function func1() external pure returns (string memory) {
        return "Child1";
    }

    function killme() external {
        selfdestruct(payable(address(0)));
    }
}

contract Child2 {
    function func2() external pure returns (string memory) {
        return "Child2";
    }

    function killme() external {
        selfdestruct(payable(address(0)));
    }
}

contract Parent {
    event MetamorphicContract(address indexed metamorphicAddress);

    function createChild1() external returns (address child1Address) {
        Child1 child = new Child1();
        emit MetamorphicContract(address(child));
        return address(child);
    }

    function createChild2() external returns (address child2Address) {
        Child2 child = new Child2();
        emit MetamorphicContract(address(child));
        return address(child);
    }

    function killme() external {
        selfdestruct(payable(address(0)));
    }
}

contract Factory {
    event ParentCreated(address parentAddress);
    uint256 constant SALT = 777;

    function create2Parent() external returns (address parentAddress) {
        Parent parent = new Parent{salt: bytes32(SALT)}();
        emit ParentCreated(address(parent));
        return address(parent);
    }
}
