// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleLottery {
    address public owner;
    address[] public players;
    uint256 public ticketPrice;
    address public lastWinner;

    uint256 public min_players=3;//new----min no of players required added
    uint256 public max_players=5;//new----max no of players that can join the lottery added

    event TicketBought(address indexed player);
    event WinnerPicked(address indexed winner, uint256 amountWon);

    constructor(uint256 _ticketPrice) {
        owner = msg.sender;
        ticketPrice = _ticketPrice; // e.g., 0.01 ETH
    }

    // Anyone can buy a ticket
    function buyTicket() external payable {
        require(msg.value == ticketPrice, "Incorrect ticket price");

        require(players.length<max_players,"Lottery is full!");//newly added

        players.push(msg.sender);
        emit TicketBought(msg.sender);
    }

    // Admin picks a winner
    function pickWinner() external {
        require(msg.sender == owner, "Only owner can pick winner");
        require(players.length > 0, "No players in lottery");

        require(players.length>=min_players,"Not Enough players to pick winner!");//newly added

        // Simple random generator (not secure, but OK for demo projects)
        uint256 randomNumber = uint256(
            keccak256(abi.encodePacked(block.timestamp, players, block.prevrandao))
        );

        uint256 winnerIndex = randomNumber % players.length;
        address payable winner = payable(players[winnerIndex]);

        uint256 amountWon = address(this).balance;

        // Send entire pool to the winner
        winner.transfer(amountWon);
        lastWinner = winner;

        emit WinnerPicked(winner, amountWon);

        // Reset for next round
        delete players;
    }

    // VIEW FUNCTIONS
    function getPlayers() external view returns (address[] memory) {
        return players;
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
