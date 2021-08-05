/*Constants and state variables.*/
var canvas = document.querySelector("canvas");
var c = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight - 100;
var theta = 4;
const ANGULAR_OFFSET = 25;
var BRANCH_LENGTH = 1;
const LENGTH_OFFSET = 25;
var root;
var keys = [];

const Node = class {
  constructor(value, parent) {
    this.value = value;
    this.left = null;
    this.right = null;
    this.parent = parent;
    this.height = 0;
  }
};

var root = null; //main tree structure

/*Draws a node at (x,y) with content 'text'*/
var drawNode = (x, y, text) => {
  c.beginPath();
  c.arc(x, y, 25, 0, 2 * Math.PI);
  c.fillStyle = "#ffffff";
  c.fill();
  c.stroke();
  c.font = "20px Calibri";
  var l = text.length;
  c.fillStyle = "#000000";
  c.fillText(text, x - (10 / 2) * l, y + 5);
};

/*Uses drawNode(...) to draw the entire tree pointed at by root at position (x,y).*/
var drawTree = (root, x, y) => {
  if (root != null) {
    if (root.left != null) {
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(
        x - (BRANCH_LENGTH + LENGTH_OFFSET) / Math.tan((theta * Math.PI) / 180),
        y + (BRANCH_LENGTH + LENGTH_OFFSET)
      );
      c.stroke();
      theta += ANGULAR_OFFSET;
      BRANCH_LENGTH += LENGTH_OFFSET;
      drawTree(
        root.left,
        x -
          BRANCH_LENGTH / Math.tan(((theta - ANGULAR_OFFSET) * Math.PI) / 180),
        y + BRANCH_LENGTH
      );
      BRANCH_LENGTH -= LENGTH_OFFSET;
      theta -= ANGULAR_OFFSET;
    }
    if (root.right != null) {
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(
        x + (BRANCH_LENGTH + LENGTH_OFFSET) / Math.tan((theta * Math.PI) / 180),
        y + (BRANCH_LENGTH + LENGTH_OFFSET)
      );
      c.stroke();
      theta += ANGULAR_OFFSET;
      BRANCH_LENGTH += LENGTH_OFFSET;
      drawTree(
        root.right,
        x +
          BRANCH_LENGTH / Math.tan(((theta - ANGULAR_OFFSET) * Math.PI) / 180),
        y + BRANCH_LENGTH
      );
      BRANCH_LENGTH -= LENGTH_OFFSET;
      theta -= ANGULAR_OFFSET;
    }
    drawNode(x, y, "" + root.value);
  }
};

/*Adds a node to the tree and balances it by calling appropriate functions*/
var addNode = (node, value) => {
  if (node == null) {
    node = new Node(value, null);
    root = node;
    return;
  }
  if (value < node.value) {
    if (node.left == null) {
      node.left = new Node(value, node);
      updateAllHeights(root);
      var ubNode = unbalancedNode(node.left);
      if (ubNode != null) {
        if (ubNode.parent == null) {
          root = rotations(ubNode, getPattern(ubNode, ""));
          updateAllHeights(root);
        } else {
          var parent = ubNode.parent;
          if (parent.left == ubNode) {
            parent.left = rotations(ubNode, getPattern(ubNode, ""));
            updateAllHeights(root);
          } else {
            parent.right = rotations(ubNode, getPattern(ubNode, ""));
            updateAllHeights(root);
          }
        }
      }
    } else addNode(node.left, value);
    return;
  }
  if (node.right == null) {
    node.right = new Node(value, node);
    updateAllHeights(root);
    var ubNode = unbalancedNode(node.right);
    if (ubNode != null) {
      if (ubNode.parent == null) {
        root = rotations(ubNode, getPattern(ubNode, ""));
        updateAllHeights(root);
      } else {
        var parent = ubNode.parent;
        if (parent.left == ubNode) {
          parent.left = rotations(ubNode, getPattern(ubNode, ""));
          updateAllHeights(root);
        } else {
          parent.right = rotations(ubNode, getPattern(ubNode, ""));
          updateAllHeights(root);
        }
      }
    }
  } else addNode(node.right, value);
  return;
};

/*Removes a node from the tree and balances if necessary.*/
var removeNode = (node, value) => {
  var toRemove = node;
  if (toRemove == root && toRemove.left == null && toRemove.right == null) {
    root = null;
    return;
  }
  if (toRemove.left == null && toRemove.right == null) {
    var parent = toRemove.parent;
    removeNodeHelper(toRemove, value);
    var ubNode = unbalancedNode(parent);
    if (ubNode != null) {
      if (ubNode.parent == null) {
        root = rotations(ubNode, getPattern(ubNode, ""));
        updateAllHeights(root);
      } else {
        var parent = ubNode.parent;
        if (parent.left == ubNode) {
          parent.left = rotations(ubNode, getPattern(ubNode, ""));
          updateAllHeights(root);
        } else {
          parent.right = rotations(ubNode, getPattern(ubNode, ""));
          updateAllHeights(root);
        }
      }
    }
    return;
  }
  if (toRemove.left == null) {
    var replacement = toRemove.right;
    while (replacement.left != null) replacement = replacement.left;
    var t = toRemove.value;
    toRemove.value = replacement.value;
    replacement.value = t;
    removeNode(replacement, value);
  } else {
    var replacement = toRemove.left;
    while (replacement.right != null) replacement = replacement.right;
    var t = toRemove.value;
    toRemove.value = replacement.value;
    replacement.value = t;
    removeNode(replacement, value);
  }
};
/*Hepler funtion - removes a node with no children*/
var removeNodeHelper = (toRemove, value) => {
  var parent = toRemove.parent;
  if (parent.left == toRemove) parent.left = null;
  else parent.right = null;
  updateAllHeights(root);
  keys.splice(keys.indexOf(value), 1);
  return;
};

/*searches for a node with the value 'value'*/
var search = (node, value) => {
  if (node.value == value) return node;
  else if (value < node.value) {
    return search(node.left, value);
  } else return search(node.right, value);
};

/*Event listener for button click*/
document.querySelector("button").addEventListener("click", () => {
  var el = document.querySelector(".command-input");
  var command = el.value;
  processCommand(command);
  el.value = "";
});

/*Reads the command and calls addNode or removeNde accordingly while also managing status messages.*/
var processCommand = (command) => {
  try {
    var words = command.split(" ");
    var action = words[0];
    var values = words[1];
    var items = values.split(",");
    for (var num in items) {
      var value = parseInt(items[num]);
      if (action == "ADD") {
        if (keys.includes(value)) {
          document.querySelector(".status-message").style.color = "red";
          document.querySelector(".status-message").textContent =
            "Task Unsuccessful. Duplicate keys not allowed.";
        } else if (keys.length >= 31) {
          document.querySelector(".status-message").style.color = "red";
          document.querySelector(".status-message").textContent =
            "Task Unsuccessful. Node limit reached.";
        } else {
          addNode(root, value);
          document.querySelector(".status-message").style.color = "green";
          document.querySelector(".status-message").textContent =
            "Node(s) added successfully!";
          keys.push(value);
          c.fillStyle = "#ffffff";
          c.fillRect(0, 0, canvas.width, canvas.height);
          drawTree(root, canvas.width / 2, 100);
        }
      } else if (action == "REM") {
        if (!keys.includes(value)) {
          document.querySelector(".status-message").style.color = "red";
          document.querySelector(".status-message").textContent =
            "Node not present!";
        } else {
          removeNode(search(root, value), value);
          document.querySelector(".status-message").style.color = "green";
          document.querySelector(".status-message").textContent =
            "Node(s) removed successfully!";
          c.fillStyle = "#ffffff";
          c.fillRect(0, 0, canvas.width, canvas.height);
          drawTree(root, canvas.width / 2, 100);
        }
      } else {
        document.querySelector(".status-message").style.color = "red";
        document.querySelector(".status-message").textContent =
          "Invalid syntax";
      }
    }
  } catch (err) {
    console.log(err);
    document.querySelector(".status-message").style.color = "red";
    document.querySelector(".status-message").textContent = "Invalid syntax";
  }
};

/*Find the closest unbalanced node from the give node.*/
var unbalancedNode = (node) => {
  if (node == null) return null;
  var leftHeight = node.left == null ? -1 : node.left.height;
  var rightHeight = node.right == null ? -1 : node.right.height;
  if (Math.abs(leftHeight - rightHeight) >= 2) return node;
  else return unbalancedNode(node.parent);
};

/*Helper funtion to help determine the kind of rotation needed to balance the tree.*/
var getPattern = (node, pattern) => {
  if (pattern.length == 2) return pattern;
  var leftHeight = node.left == null ? -1 : node.left.height;
  var rightHeight = node.right == null ? -1 : node.right.height;
  if (leftHeight > rightHeight) {
    pattern += "L";
    return getPattern(node.left, pattern);
  } else {
    pattern += "R";
    return getPattern(node.right, pattern);
  }
};

/*Calls the rotation functions according to the pattern.*/
var rotations = (ubNode, pattern) => {
  if (pattern == "RR") {
    return rotateLeft(ubNode);
  }

  if (pattern == "LL") {
    return rotateRight(ubNode);
  }

  if (pattern == "LR") {
    ubNode.left = rotateLeft(ubNode.left);
    return rotateRight(ubNode);
  }

  if (pattern == "RL") {
    ubNode.right = rotateRight(ubNode.right);
    return rotateLeft(ubNode);
  }
};

/*ROTATION FUNCTIONS ADAPTED TO JAVASCRIPT'S LACK OF POINTERS.*/
var rotateLeft = (ubNode) => {
  var b = ubNode.right;
  b.parent = ubNode.parent;
  ubNode.right = b.left;
  if (b.left != null) b.left.parent = ubNode;
  b.left = ubNode;
  ubNode.parent = b;
  return b;
};

var rotateRight = (ubNode) => {
  var b = ubNode.left;
  b.parent = ubNode.parent;
  ubNode.left = b.right;
  if (b.right != null) b.right.parent = ubNode;
  b.right = ubNode;
  ubNode.parent = b;
  return b;
};

/*Updates heights of all nodes in the tree.*/
var updateAllHeights = (node) => {
  if (node == null) return;
  else if (node.left == null && node.right == null) {
    node.height = 0;
    return;
  } else {
    updateAllHeights(node.left);
    updateAllHeights(node.right);
    if (node.left == null) node.height = node.right.height + 1;
    else if (node.right == null) node.height = node.left.height + 1;
    else node.height = Math.max(node.left.height, node.right.height) + 1;
  }
};

/*Returns heights of all nodes in the tree as a list in level-order. For testing purposes.*/
var getHeights = () => {
  var queue = [];
  queue.push(root);
  var heights = [];
  while (queue.length != 0) {
    var node = queue[0];
    heights.push(node.height);
    if (node.left != null) queue.push(node.left);
    if (node.right != null) queue.push(node.right);
    queue.shift();
  }
  return heights;
};
