const hre = require("hardhat");

async function main() {
  const [institution] = await hre.ethers.getSigners();
  console.log("Institution / deployer address:", institution.address);

  // deploy
  const CertificateRegistry = await hre.ethers.getContractFactory("CertificateRegistry");
  const contract = await CertificateRegistry.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("Контракт задеплоен по адресу:", contractAddress);

  // data
  const certificateData = {
    recipient: "0x14ABF3D3F6dbD4fE946abF45dcBc4bBABac79152",
    message: "Some certificate",
    studentName: "Kirill Alferov",
    course: "ITMO course",
    issueDate: "2025-12-05",
    tokenURI: "ipfs://bafkreibptlfaq26txmpnghima4h34bfejbv4dygqddqeexwu32pamyptlu",
  };

  console.log("Выпуск сертификата:");
  console.log("Студент:", certificateData.studentName);
  console.log("Курс:", certificateData.course);

  const isRegistered = await contract.registeredInstitutions(institution.address);
  if (!isRegistered) {
    console.log("\nРегистрируем учреждение...");
    const registerTx = await contract.registerInstitution(institution.address);
    await registerTx.wait();
    console.log("✓ Учреждение зарегистрировано как:", institution.address);
  }

  // 5. Выпускаем сертификат от имени учреждения (institution == deployer)
  console.log("\nВыпускаем сертификат...");
  // contract уже подключён к institution по умолчанию, connect необязателен
  const tx = await contract.issueCertificate(
    certificateData.recipient,
    certificateData.message,
    certificateData.tokenURI
  );

  await tx.wait();

  console.log("✓ Сертификат успешно выпущен!");
  console.log("Адрес контракта:", contractAddress);
  console.log("Транзакция:", tx.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });