const {ethers} = require("hardhat");
require('dotenv').config();

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Minting SBT with account:", deployer.address);

    // Адрес задеплоенного контракта
    const contractAddress = process.env.CONTRACT_ADDR;

    // Получаем контракт
    const SoulboundToken = await ethers.getContractFactory("Soulbound");
    const sbt = SoulboundToken.attach(contractAddress);

    // Адрес получателя
    const recipientAddress = process.env.ADDRESS;

    console.log(`Minting SBT to: ${recipientAddress}`);

    // Вызываем функцию mint
    const tx = await sbt.safeMint(recipientAddress);
    await tx.wait();

    console.log("SBT successfully minted to:", recipientAddress);
    console.log("Transaction hash:", tx.hash);

    // Проверяем баланс
    const balance = await sbt.balanceOf(recipientAddress);
    console.log(`Balance of ${recipientAddress}: ${balance} SBT`);
}

main().catch((error) => {
    console.error("Error minting SBT:", error);
    process.exitCode = 1;
});