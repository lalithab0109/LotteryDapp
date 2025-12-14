import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, ABI } from "./contractConfig";

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);

  const [ticketPrice, setTicketPrice] = useState("");
  const [status, setStatus] = useState("");

  const [balance, setBalance] = useState("0");
  const [players, setPlayers] = useState([]);
  const [lastWinner, setLastWinner] = useState("None");

  const [min_players,setmin_players]=useState("0");
  const [max_players,setmax_players]=useState("0");

  const [contract_ticket_price,setcontract_ticket_price]=useState("");


  // ---------------- CONNECT WALLET ----------------
  const connectWallet = async () => {
    try {
      if (!window.ethereum) return alert("MetaMask not installed!");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      setAccount(address);

      const lotteryContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        ABI,
        signer
      );

      setContract(lotteryContract);
      setStatus("Wallet connected.");
    } catch (error) {
      console.error(error);
      setStatus("Error connecting wallet.");
    }
  };

  // ---------------- BUY TICKET ----------------
  const buyTicket = async () => {
    if (!contract) return alert("Connect wallet first!");

    try {
      const tx = await contract.buyTicket({
        value: ethers.parseEther(ticketPrice),
      });

      await tx.wait();
      setStatus("Ticket purchased successfully!");
    } catch (error) {
        console.error(error);

        if (error.info?.error?.message?.includes("Lottery is full")) {
          setStatus("Lottery is full! Maximum players reached.");
        } else {
          setStatus("Error buying ticket.");
        }
    }
  };

  // ---------------- PICK WINNER ----------------
  const pickWinner = async () => {
    if (!contract) return alert("Connect wallet first!");

    try {
      const tx = await contract.pickWinner();
      await tx.wait();
      setStatus("Winner selected!");
      loadInfo();
    } catch (error) {
        console.error(error);

        if (error.info?.error?.message?.includes("Not enough players")) {
          setStatus(`Need at least ${min_players} players to pick winner.`);
        } else {
          setStatus("Error picking winner.");
        }
    }

  };

  // ---------------- LOAD INFO FROM CONTRACT ----------------
  const loadInfo = async () => {
    if (!contract) return;

    try {
      const bal = await contract.getBalance();
      setBalance(ethers.formatEther(bal));

      const p = await contract.getPlayers();
      setPlayers(p);

      const w = await contract.lastWinner();
      setLastWinner(
        w === "0x0000000000000000000000000000000000000000" ? "None" : w
      );

      const minp= await contract.min_players();
      setmin_players(Number(minp));

      const maxp= await contract.max_players();
      setmax_players(Number(maxp));

      const ctp= await contract.ticketPrice();
      setcontract_ticket_price(ethers.formatEther(ctp));

    } catch (error) {
      console.error(error);
      setStatus("Error loading contract info.");
    }
  };

  useEffect(() => {
    if (contract) loadInfo();
  }, [contract]);

  return (
    <div style={{ maxWidth: "600px", margin: "auto", fontFamily: "Arial" }}>
      <h1>🎉 Lottery DApp</h1>
      <p>Buy a ticket → Admin picks winner → Winner gets entire pool</p>

      <button onClick={connectWallet}>Connect Wallet</button>
      <p><strong>Connected:</strong> {account || "Not connected"}</p>

      <hr />

      <h2>Buy Ticket</h2>

      <p><strong>Contract Ticket Price: </strong>{contract_ticket_price} ETH</p>

      <input
        type="text"
        placeholder="Ticket price in ETH"
        value={ticketPrice}
        onChange={(e) => setTicketPrice(e.target.value)}
      />
      <button onClick={buyTicket}>Buy Ticket</button>

      <hr />

      <h2>Pick Winner (Owner Only)</h2>
      <button onClick={pickWinner}>Pick Winner</button>

      <hr />

      <h2>Lottery Info</h2>
      <button onClick={loadInfo}>Refresh Info</button>

      <p>
        <strong>Contract Balance:</strong> {balance} ETH
      </p>


      <p><strong>Minimum Players Required: </strong>{min_players}</p>
      <p><strong>Maximum Players Allowed: </strong>{max_players}</p>
      <p><strong>Current Players Count: </strong>{players.length}</p>
      <p><strong>Number Of Slots Left: </strong>{max_players-players.length}</p>


      <p><strong>Players:</strong></p>
      <ul>
        {players.length === 0 ? (
          <li>No players yet.</li>
        ) : (
          players.map((p, i) => <li key={i}>{p}</li>)
        )}
      </ul>

      <p>
        <strong>Last Winner:</strong> {lastWinner}
      </p>

      <hr />

      <p><strong>Status:</strong> {status}</p>
    </div>
  );
}

export default App;
