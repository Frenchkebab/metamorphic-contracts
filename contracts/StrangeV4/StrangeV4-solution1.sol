pragma solidity 0.8.16;

/// @notice Implementation contracts

contract Implementation1 {
    function inc(uint256 input) external pure returns (uint256) {
        return input + 1;
    }

    function killme() external {
        selfdestruct(payable(address(0)));
    }
}

contract Implementation2 {
    function inc(uint256 input) external pure returns (uint256) {
        return input + 100;
    }

    function killme() external {
        selfdestruct(payable(address(0)));
    }
}
