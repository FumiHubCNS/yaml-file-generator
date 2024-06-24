function clearAll() {

    blocks.forEach(block => block.remove());

    //blocks = [];
    blockCounter = 0;
    isDragging = false;
    selectedBlock = null;
    offsetX = 0;
    offsetY = 0;
    startNode = null;
    connections = [];
    globalIdCounter = 0;
    groupCounter = 1;
    groupParameters = {};

    const tableBody = document.getElementById('groupInfoTable').querySelector('tbody');
    tableBody.innerHTML = '';

    const listContainer = document.getElementById('listContainer');
    listContainer.innerHTML = ''; 

    drawConnections();
}

canvas.addEventListener('contextmenu', deleteConnection);
canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    connections = connections.filter(connection => {
        const startRect = connection.start.getBoundingClientRect();
        const endRect = connection.end.getBoundingClientRect();
        const startX = startRect.left + startRect.width / 2 - container.offsetLeft;
        const startY = startRect.top + startRect.height / 2 - container.offsetTop;
        const endX = endRect.left + endRect.width / 2 - container.offsetLeft;
        const endY = endRect.top + endRect.height / 2 - container.offsetTop;
        const dist = Math.abs((endY - startY) * x - (endX - startX) * y + endX * startY - endY * startX) / Math.sqrt((endY - startY) ** 2 + (endX - startX) ** 2);
        return dist > 5;
    });
    drawConnections();
});

addBlockButton.addEventListener('click', () => {addBlock();});
clearAllButton.addEventListener('click', () => {clearAll();});

document.getElementById('searchData').addEventListener('click', searchAndShowResults);
document.getElementById('addButton').addEventListener('click', addAnchor);
document.getElementById('saveImage').addEventListener('click', saveAsPNG);
document.getElementById('saveData').addEventListener('click', saveAsJSON);
document.getElementById('loadDataButton').addEventListener('click', () => document.getElementById('loadData').click());
document.getElementById('loadData').addEventListener('change', loadFromJSON);
document.getElementById('addJsonButton').addEventListener('click', () => {document.getElementById('addJsonInput').click();});
document.getElementById('addJsonInput').addEventListener('change', addFromJSON);

document.getElementById('generateYaml').addEventListener('click', () => {
    const yamlFilesContent = generateYAMLFiles();
    showYAMLFilesPopup(yamlFilesContent);
});

document.getElementById('downloadYaml').addEventListener('click', () => {
    const yamlFilesContent = generateYAMLFiles();
    if (Object.keys(yamlFilesContent).length === 1) {
        const fileName = Object.keys(yamlFilesContent)[0];
        downloadYAML(fileName, yamlFilesContent[fileName]);
    } else {
        downloadYAMLAsZip(yamlFilesContent);
    }
});

window.addEventListener('scroll', drawConnections);
