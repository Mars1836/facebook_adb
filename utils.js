const xml2js = require("xml2js");

const parseXMLToNodeArray = async (xmlContent) => {
  const parser = new xml2js.Parser({ explicitArray: false });
  const result = await parser.parseStringPromise(xmlContent);

  const nodes = [];

  const traverseNodes = (node, parentBounds = null) => {
    if (!node) return;

    // Tạo đối tượng đại diện cho `node`
    const currentNode = {
      index: node.$.index,
      text: node.$.text,
      resourceId: node.$["resource-id"],
      className: node.$.class,
      package: node.$.package,
      contentDesc: node.$["content-desc"],
      checkable: node.$.checkable === "true",
      clickable: node.$.clickable === "true",
      bounds: node.$.bounds,
      parentBounds: parentBounds,
    };

    nodes.push(currentNode);

    // Duyệt các con của `node`
    if (node.node) {
      const children = Array.isArray(node.node) ? node.node : [node.node];
      children.forEach((child) => traverseNodes(child, currentNode.bounds));
    }
  };

  // Bắt đầu duyệt từ root
  traverseNodes(result.hierarchy.node);
  return nodes;
};
function convertStringBoundsToBounds(stringBounds) {
  const result = stringBounds
    .match(/\[.*?\]/g) // Match all occurrences of square brackets with content
    .map((item) => JSON.parse(item)); // Convert each matched string into an array
  return result;
}
function getCenterCoordinates(stringBounds) {
  const coordinates = convertStringBoundsToBounds(stringBounds);
  const centerX = (coordinates[0][0] + coordinates[1][0]) / 2;
  const centerY = (coordinates[0][1] + coordinates[1][1]) / 2;
  return [centerX, centerY];
}
module.exports = {
  getCenterCoordinates,
  parseXMLToNodeArray,
  convertStringBoundsToBounds,
};
