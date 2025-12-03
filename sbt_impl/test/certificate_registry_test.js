const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CertificateRegistry Contract", function () {
  let certificateRegistry;
  let owner, institution, recipient, otherAccount;

  beforeEach(async function () {
    [owner, institution, recipient, otherAccount] = await ethers.getSigners();
    
    const CertificateRegistry = await ethers.getContractFactory("CertificateRegistry");
    certificateRegistry = await CertificateRegistry.deploy();
    await certificateRegistry.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await certificateRegistry.name()).to.equal("InstitutionalCertificate");
      expect(await certificateRegistry.symbol()).to.equal("ICERT");
    });

    it("Should set the deployer as the owner", async function () {
      expect(await certificateRegistry.owner()).to.equal(owner.address);
    });
  });

  describe("Institution Registration Management", function () {
    it("Owner can register an institution", async function () {
      await certificateRegistry.connect(owner).registerInstitution(institution.address);
      expect(await certificateRegistry.isRegisteredInstitution(institution.address)).to.be.true;
    });

    it("Non-owner can register an institution", async function () {
      await certificateRegistry.connect(otherAccount).registerInstitution(institution.address);
      expect(await certificateRegistry.isRegisteredInstitution(institution.address)).to.be.true;
    });

    it("Cannot register the same institution twice", async function () {
      await certificateRegistry.connect(owner).registerInstitution(institution.address);
      await expect(
        certificateRegistry.connect(owner).registerInstitution(institution.address)
      ).to.be.revertedWith("Already registered");
    });

    it("Cannot register zero address as institution", async function () {
      const zeroAddress = ethers.ZeroAddress;
      await expect(
        certificateRegistry.connect(owner).registerInstitution(zeroAddress)
      ).to.be.revertedWith("Invalid address");
    });
  });

  describe("Certificate Issuance", function () {
    beforeEach(async function () {
      await certificateRegistry.connect(owner).registerInstitution(institution.address);
    });

    it("Registered institution can issue a certificate", async function () {
      const certificateMessage = "CERT-001";
      const tokenURI = "https://example.com/cert/001";

      await certificateRegistry.connect(institution).issueCertificate(recipient.address, certificateMessage, tokenURI);

      const certInfo = await certificateRegistry.getCertificateInfo(1);

      expect(certInfo.certificateMessage).to.equal(certificateMessage);
      expect(certInfo.institution).to.equal(institution.address);
      expect(certInfo.recipient).to.equal(recipient.address);
      expect(certInfo.issuedAt).to.be.gt(0);

      expect(await certificateRegistry.ownerOf(1)).to.equal(recipient.address);
      expect(await certificateRegistry.tokenURI(1)).to.equal(tokenURI);
      expect(await certificateRegistry.balanceOf(recipient.address)).to.equal(1);
    });

    it("Unregistered institution cannot issue a certificate", async function () {
      const certificateMessage = "CERT-001";
      const tokenURI = "https://example.com/cert/001";

      await expect(
        certificateRegistry.connect(otherAccount).issueCertificate(recipient.address, certificateMessage, tokenURI)
      ).to.be.revertedWith("Not a registered institution");
    });

    it("Cannot issue certificate to zero address", async function () {
      const certificateMessage = "CERT-001";
      const tokenURI = "https://example.com/cert/001";

      await expect(
        certificateRegistry.connect(institution).issueCertificate(ethers.ZeroAddress, certificateMessage, tokenURI)
      ).to.be.revertedWith("Invalid recipient");
    });

    it("Certificate message cannot be empty", async function () {
      const tokenURI = "https://example.com/cert/001";

      await expect(
        certificateRegistry.connect(institution).issueCertificate(recipient.address, "", tokenURI)
      ).to.be.revertedWith("Certificate message required");
    });

    it("Certificate message must be unique", async function () {
      const certificateMessage = "CERT-001";
      const tokenURI = "https://example.com/cert/001";

      await certificateRegistry.connect(institution).issueCertificate(recipient.address, certificateMessage, tokenURI);

      await expect(
        certificateRegistry.connect(institution).issueCertificate(recipient.address, certificateMessage, tokenURI + "-2")
      ).to.be.revertedWith("Certificate message already exists");
    });

    it("Token IDs should increment correctly", async function () {
      const tokenURI = "https://example.com/cert/";

      await certificateRegistry.connect(institution).issueCertificate(recipient.address, "CERT-001", tokenURI + "001");
      await certificateRegistry.connect(institution).issueCertificate(recipient.address, "CERT-002", tokenURI + "002");
      await certificateRegistry.connect(institution).issueCertificate(recipient.address, "CERT-003", tokenURI + "003");

      expect(await certificateRegistry.ownerOf(1)).to.equal(recipient.address);
      expect(await certificateRegistry.ownerOf(2)).to.equal(recipient.address);
      expect(await certificateRegistry.ownerOf(3)).to.equal(recipient.address);
      expect(await certificateRegistry.balanceOf(recipient.address)).to.equal(3);
    });
  });

  describe("Certificate Verification and Queries", function () {
    let certificateMessage, tokenURI;

    beforeEach(async function () {
      await certificateRegistry.connect(owner).registerInstitution(institution.address);
      
      certificateMessage = "UNIQUE-CERT-12345";
      tokenURI = "https://university.edu/certs/12345";
      await certificateRegistry.connect(institution).issueCertificate(recipient.address, certificateMessage, tokenURI);
    });

    it("Can verify certificate by message", async function () {
      const [isValid, retrievedTokenId, certOwner, certInstitution, issuedAt] =
        await certificateRegistry.verifyCertificateByNumber(certificateMessage);

      expect(isValid).to.be.true;
      expect(retrievedTokenId).to.equal(1);
      expect(certOwner).to.equal(recipient.address);
      expect(certInstitution).to.equal(institution.address);
      expect(issuedAt).to.be.gt(0);
    });

    it("Verifying non-existent certificate message returns false", async function () {
      const [isValid, tokenId, certOwner, certInstitution, issuedAt] =
        await certificateRegistry.verifyCertificateByNumber("NON-EXISTENT-999");

      expect(isValid).to.be.false;
      expect(tokenId).to.equal(0);
      expect(certOwner).to.equal(ethers.ZeroAddress);
      expect(certInstitution).to.equal(ethers.ZeroAddress);
      expect(issuedAt).to.equal(0);
    });

    it("Can query certificate info by token ID", async function () {
      const [retrievedMessage, retrievedInstitution, retrievedOwner, retrievedIssuedAt] =
        await certificateRegistry.getCertificateInfo(1);

      expect(retrievedMessage).to.equal(certificateMessage);
      expect(retrievedInstitution).to.equal(institution.address);
      expect(retrievedOwner).to.equal(recipient.address);
      expect(retrievedIssuedAt).to.be.gt(0);
    });

    it("Querying non-existent token ID should revert", async function () {
      await expect(certificateRegistry.getCertificateInfo(999)).to.be.reverted;
    });
  });

  describe("Certificate Non-Transferability", function () {
    beforeEach(async function () {
      await certificateRegistry.connect(owner).registerInstitution(institution.address);
      await certificateRegistry.connect(institution).issueCertificate(
        recipient.address, 
        "CERT-NO-TRANSFER", 
        "https://example.com/cert/nt"
      );
    });

    it("Certificate NFT cannot be transferred from owner to another account", async function () {
      await expect(
        certificateRegistry.connect(recipient)["safeTransferFrom(address,address,uint256)"](
          recipient.address,
          otherAccount.address,
          1
        )
      ).to.be.revertedWith("Certificates are non-transferable");
    });
  });
});
