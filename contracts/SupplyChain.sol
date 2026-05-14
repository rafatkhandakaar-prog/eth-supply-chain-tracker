// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SupplyChain {
    struct Item {
        uint id;
        string name;
        address owner;
        address[] history;
    }

    mapping(uint => Item) public items;
    uint public itemCount;

    event ItemAdded(uint id, string name, address owner);
    event ItemTransferred(uint id, address from, address to);

    function addItem(string memory _name) public {
        itemCount++;
        items[itemCount] = Item(itemCount, _name, msg.sender, new address[](0));
        items[itemCount].history.push(msg.sender);
        emit ItemAdded(itemCount, _name, msg.sender);
    }

    function transferItem(uint _id, address _to) public {
        require(items[_id].owner == msg.sender, "Not owner");
        items[_id].owner = _to;
        items[_id].history.push(_to);
        emit ItemTransferred(_id, msg.sender, _to);
    }

    function getHistory(uint _id) public view returns (address[] memory) {
        return items[_id].history;
    }
}