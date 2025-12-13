// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CertificateRegistry is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;

    struct Certificate {
        uint256 id;
        string certificateMessage;
        address institution;
        uint256 issuedAt;
    }

    mapping(uint256 => bool) private _tokenExists;
    mapping(uint256 => Certificate) private _certificates;
    mapping(address => bool) public registeredInstitutions;

    constructor() ERC721("InstitutionalCertificate", "ICERT") {}

    function registerInstitution(address institution) public {
        require(institution != address(0), "Invalid address");
        require(!registeredInstitutions[institution], "Already registered");
        
        registeredInstitutions[institution] = true;
    }

    function issueCertificate(
        address recipient,
        string memory certificateMessage,
        string memory tokenURI_
    ) public returns (uint256) {
        require(registeredInstitutions[msg.sender], "Not a registered institution");
        require(recipient != address(0), "Invalid recipient");
        require(bytes(certificateMessage).length > 0, "Certificate message required");
        
        _tokenIdCounter += 1;
        uint256 newTokenId = _tokenIdCounter;
        
        _certificates[newTokenId] = Certificate({
            id: newTokenId,
            certificateMessage: certificateMessage,
            institution: msg.sender,
            issuedAt: block.timestamp
        });
        
        _tokenExists[newTokenId] = true;
        
        _safeMint(recipient, newTokenId);
        _setTokenURI(newTokenId, tokenURI_);
        
        return newTokenId;
    }

    function verifyCertificateByTokenId(uint256 tokenId) 
        public 
        view 
        returns (
            bool isValid,
            string memory certificateMessage,
            address recipient,
            address institution,
            uint256 issuedAt
        )
    {
        bool exists = _tokenExists[tokenId];
        if (!exists) {
            return (false,"", address(0), address(0), 0);
        }
        Certificate memory cert = _certificates[tokenId];
        return (
            true,
            cert.certificateMessage,
            ownerOf(tokenId),
            cert.institution,
            cert.issuedAt
        );
    }

   
    function isRegisteredInstitution(address institution) public view returns (bool) {
        return registeredInstitutions[institution];
    }


    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override {
        require(from == address(0), "Certificates are non-transferable");
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
        delete _certificates[tokenId];
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
