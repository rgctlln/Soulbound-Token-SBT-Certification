const { expect } = require("chai");

describe("Soulbound Token Test", function () {
    let owner;

    beforeEach(async function () {
        [owner] = await ethers.getSigners();

        const Soulbound = await ethers.getContractFactory("Soulbound");
        soulbound = await Soulbound.deploy();

        await soulbound.safeMint(owner.address);
    });

    it("check the owner is correct", async () => {
        const value = await soulbound.ownerOf(1);
        expect(value).to.equal(owner.address);
    });

    it("should revert when trying to transfer via safeTransferFrom", async () => {
        await expect(soulbound['safeTransferFrom(address,address,uint256)'](
            owner.address,
            "0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5",
            1
        )).to.be.reverted;
    });

    it("should revert when trying to transfer via transferFrom", async () => {
        await expect(soulbound['transferFrom(address,address,uint256)'](
            owner.address,
            "0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5",
            1
        )).to.be.reverted;
    });
});
