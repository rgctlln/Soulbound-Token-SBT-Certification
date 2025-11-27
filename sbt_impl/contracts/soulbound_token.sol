// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Soulbound is ERC721, ERC721URIStorage, Ownable {

    uint256 private _tokenIdCounter;

    string private constant CERT_URI = "ipfs://bafkreicejxrtqawftz62wsuey3gpptftvdlkead2ikhtfmv26t626igmgi";

    constructor() ERC721("SoulBound", "SBT") {}

    function _beforeTokenTransfer(address from, address to, uint256 tokenId)
        internal
        override
    {
        require(from == address(0), "Token not transferable");
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function safeMint(address to) public onlyOwner {
        _tokenIdCounter += 1;
        uint256 tokenId = _tokenIdCounter;

        _safeMint(to, _tokenIdCounter);
        _setTokenURI(tokenId, CERT_URI);
    }

    // The following functions are overrides required by Solidity.

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
}