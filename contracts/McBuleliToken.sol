// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title McBuleliToken
 * @notice McB utility token on BNB Smart Chain — **BEP-20** standard.
 *
 * BEP-20 and ERC-20 share the same interface on EVM chains. Remix / BscScan may
 * label this contract "ERC-20" — on BSC mainnet (chainId 56) it is a BEP-20 token.
 *
 * Required BEP-20 surface (BNB Chain):
 *   totalSupply(), balanceOf(), transfer(), allowance(), approve(), transferFrom()
 * @see https://www.bnbchain.org/en/blog/your-guide-to-creating-bep-20-tokens-on-bnb-smart-chain
 *
 * Extensions (not required by BEP-20): mint (owner), transferOwnership.
 * Deploy: Remix → Injected Provider → BNB Smart Chain → constructor(initialSupply in wei, 18 decimals).
 */
contract McBuleliToken {
    string public constant name = "McBuleli";
    string public constant symbol = "McB";
    uint8 public constant decimals = 18;

    uint256 public totalSupply;
    address public owner;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "McB: not owner");
        _;
    }

    /// @param initialSupply Whole tokens × 10**decimals (e.g. 100_000_000e18 for 100M McB).
    constructor(uint256 initialSupply) {
        owner = msg.sender;
        _mint(msg.sender, initialSupply);
        emit OwnershipTransferred(address(0), msg.sender);
    }

    /// @inheritdoc BEP-20
    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    /// @inheritdoc BEP-20
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    /// @inheritdoc BEP-20
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        require(allowed >= amount, "McB: allowance");
        if (allowed != type(uint256).max) {
            allowance[from][msg.sender] = allowed - amount;
        }
        _transfer(from, to, amount);
        return true;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "McB: zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(to != address(0), "McB: zero address");
        uint256 bal = balanceOf[from];
        require(bal >= amount, "McB: balance");
        unchecked {
            balanceOf[from] = bal - amount;
        }
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }

    function _mint(address to, uint256 amount) internal {
        require(to != address(0), "McB: zero address");
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }
}
