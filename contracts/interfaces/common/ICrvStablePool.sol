pragma solidity >=0.8.1;

interface ICrvStablePool {
  function exchange(int128 i,int128 j,uint256 dx,uint256 minDy) external returns (uint256);
}
