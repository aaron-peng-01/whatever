import { ethers } from "ethers";

// 初始化 provider 和合约实例
const provider = new ethers.providers.Web3Provider(window.ethereum);
const coinContract = new ethers.Contract(COIN_ADDRESS, COIN_ABI, provider);

// 监听 Sent 事件
coinContract.on("Sent", async (from: string, to: string, amount: ethers.BigNumber) => {
    console.log(`Coin transfer: ${amount.toString()} coins were sent from ${from} to ${to}.`);

    // 查询余额（注意 call 是同步的，但 ethers 是异步的）
    const senderBalance = await coinContract.balances(from);
    const receiverBalance = await coinContract.balances(to);

    console.log(`Balances now:\nSender: ${senderBalance.toString()}\nReceiver: ${receiverBalance.toString()}`);
});
