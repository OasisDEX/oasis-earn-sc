// SPDX-License-Identifier: MIT
pragma solidity ^0.4.21;

import "./DSAuth.sol";

contract DSGuardEvents {
  event LogPermit(bytes32 indexed src, bytes32 indexed dst, bytes32 indexed sig);

  event LogForbid(bytes32 indexed src, bytes32 indexed dst, bytes32 indexed sig);
}

contract DSGuard is DSAuth, DSAuthority, DSGuardEvents {
  bytes32 public constant ANY = bytes32(uint256(-1));

  mapping(bytes32 => mapping(bytes32 => mapping(bytes32 => bool))) acl;

  function canCall(address src_, address dst_, bytes4 sig) public view returns (bool) {
    bytes32 src = bytes32(src_);
    bytes32 dst = bytes32(dst_);

    return
      acl[src][dst][sig] ||
      acl[src][dst][ANY] ||
      acl[src][ANY][sig] ||
      acl[src][ANY][ANY] ||
      acl[ANY][dst][sig] ||
      acl[ANY][dst][ANY] ||
      acl[ANY][ANY][sig] ||
      acl[ANY][ANY][ANY];
  }

  function permit(bytes32 src, bytes32 dst, bytes32 sig) public auth {
    acl[src][dst][sig] = true;
    emit LogPermit(src, dst, sig);
  }

  function forbid(bytes32 src, bytes32 dst, bytes32 sig) public auth {
    acl[src][dst][sig] = false;
    emit LogForbid(src, dst, sig);
  }

  function permit(address src, address dst, bytes32 sig) public {
    permit(bytes32(src), bytes32(dst), sig);
  }

  function forbid(address src, address dst, bytes32 sig) public {
    forbid(bytes32(src), bytes32(dst), sig);
  }
}

contract DSGuardFactory {
  mapping(address => bool) public isGuard;

  function newGuard() public returns (DSGuard guard) {
    guard = new DSGuard();
    guard.setOwner(msg.sender);
    isGuard[guard] = true;
  }
}
