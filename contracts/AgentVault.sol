// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AgentVault - Verifiable Multi-Agent On-Chain Execution Engine
 * @notice Arc Network üzerinde otonom ajanların doğrulanmış kararlarını yürütür.
 */
contract AgentVault {
    address public owner;
    
    // Ajan rolleri
    mapping(address => bool) public isAuthorizedAgent;
    
    // Oturum Yetkileri (Session Keys)
    struct Session {
        uint256 maxSpendLimit;
        uint256 currentSpent;
        uint256 validUntil;
        bool isActive;
    }
    
    mapping(address => Session) public agentSessions;
    
    // Ajanların aldığı kararların On-Chain Hash İzi (Proof of Execution)
    event ExecutionVerified(
        address indexed agent,
        bytes32 indexed intentHash,
        uint256 amount,
        uint256 timestamp
    );
    
    event SessionGranted(address indexed agent, uint256 maxSpend, uint256 duration);

    modifier onlyOwner() {
        require(msg.sender == owner, "Unauthorized: Not Owner");
        _;
    }

    modifier onlyValidAgent() {
        require(isAuthorizedAgent[msg.sender], "Unauthorized: Not Agent");
        Session storage session = agentSessions[msg.sender];
        require(session.isActive, "Session expired or inactive");
        require(block.timestamp <= session.validUntil, "Session time elapsed");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // Kullanıcı ajana belirli süre ve bütçe kısıtıyla otonom işlem yetkisi verir
    function grantAgentSession(
        address _agent, 
        uint256 _maxSpendLimit, 
        uint256 _durationInSeconds
    ) external onlyOwner {
        isAuthorizedAgent[_agent] = true;
        agentSessions[_agent] = Session({
            maxSpendLimit: _maxSpendLimit,
            currentSpent: 0,
            validUntil: block.timestamp + _durationInSeconds,
            isActive: true
        });

        emit SessionGranted(_agent, _maxSpendLimit, _durationInSeconds);
    }

    // Executor Ajanı, LLM'in ürettiği Cryptographic Intent Hash'ini sunarak otonom işlem yapar
    function executeAgentIntent(
        bytes32 _intentHash,
        address payable _target,
        uint256 _amount
    ) external onlyValidAgent returns (bool) {
        Session storage session = agentSessions[msg.sender];
        require(session.currentSpent + _amount <= session.maxSpendLimit, "Spend limit exceeded");

        session.currentSpent += _amount;

        // On-chain fon transferi / Etkileşim
        (bool success, ) = _target.call{value: _amount}("");
        require(success, "On-chain execution failed");

        emit ExecutionVerified(msg.sender, _intentHash, _amount, block.timestamp);
        return true;
    }

    receive() external payable {}
}