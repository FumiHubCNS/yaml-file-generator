
function showPopup(title, globalName, param, value, x, y) {
    const popup = document.createElement('div');
    popup.classList.add('popup');
    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;
    popup.innerHTML = `
        <button class="closePopup" style="float: right; background: #d32f2f; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 5px;">X</button>
        <h2 style="margin: 0 0 10px; color: #00796b;">Details</h2>
        <p><strong>Title:</strong> <span id="popupTitle">${title}</span></p>
        <p><strong>Global Name:</strong> <span id="popupGlobalName">${globalName}</span></p>
        <p><strong>Parameter:</strong> <span id="popupParameter">${param}</span></p>
        <p><strong>Value:</strong> <span id="popupValue">${value}</span></p>
    `;
    
    // 閉じるボタンのイベント
    popup.querySelector('.closePopup').addEventListener('click', () => {
        popup.remove();
    });

    // ドラッグ可能にする
    popup.addEventListener('mousedown', (event) => {
        let shiftX = event.clientX - popup.getBoundingClientRect().left;
        let shiftY = event.clientY - popup.getBoundingClientRect().top;

        function moveAt(pageX, pageY) {
            popup.style.left = pageX - shiftX + 'px';
            popup.style.top = pageY - shiftY + 'px';
        }

        function onMouseMove(event) {
            moveAt(event.pageX, event.pageY);
        }

        document.addEventListener('mousemove', onMouseMove);

        popup.onmouseup = function() {
            document.removeEventListener('mousemove', onMouseMove);
            popup.onmouseup = null;
        };

    });

    popup.ondragstart = function() {
        return false;
    };

    document.body.appendChild(popup);
}

function populateInputSelect() {
    inputs.forEach((input, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = input.title;
        inputSelect.appendChild(option);
    });
}

addBlockButton.addEventListener('click', () => {
    addBlock();
});

clearAllButton.addEventListener('click', () => {
    clearAll();
});

function truncateTitle(title, maxLength) {
    if (title.length > maxLength) {
        return title.substring(0, maxLength) + '...';
    } else {
        return title;
    }
}

function truncateGlobalName(name, maxLength, frontLength, backLength) {
    if (name.length > maxLength) {
        return name.substring(0, frontLength) + '...' + name.substring(name.length - backLength);
    } else {
        return name;
    }
}

function createTooltip(element, text) {
    element.setAttribute('title', text);
}

function addBlock() {
    const selectedInputIndex = inputSelect.value;
    const input = inputs[selectedInputIndex];
    const offsetTop = 60; // ブロック上端から最初のノードまでのオフセット
    const nodeSpacing = 25; // ノード間の行間隔

    // ノードの間隔と数に応じたブロックの高さを計算
    const blockHeight = input.parameters.length * nodeSpacing + 40;

    globalIdCounter++;
    const globalId = globalIdCounter;

    // 表示する文字数の設定
    const maxTitleLength = 22; // タイトルの最大表示文字数
    const maxGlobalNameLength = 27; // タイトルの最大表示文字数
    const globalNameFrontLength = 12; // `GlobalName` の先頭表示文字数
    const globalNameBackLength = 12; // `GlobalName` の末尾表示文字数
    
    // タイトルと GlobalName をトリミング
    const truncatedTitle = truncateTitle(input.title, maxTitleLength);
    const inputString = input.title;
    const parts = inputString.split("::");
    const lastElement = parts[parts.length - 1];
    const globalName = `My${lastElement}Num${globalId}`;
    const truncatedGlobalName = truncateGlobalName(globalName, maxGlobalNameLength, globalNameFrontLength, globalNameBackLength);

    // GlobalName 表示のスタイル設定
    const globalNameFontSize = '12px'; // GlobalName の文字サイズ
    const globalNameTopOffset = '-15px'; // GlobalName の表示位置のオフセット

    const block = document.createElement('div');
    block.className = 'block';
    block.id = `block${globalId}`;
    block.style.height = `${blockHeight}px`;
    block.style.top = `${Math.random() * (container.clientHeight - blockHeight)}px`;
    block.style.left = `${Math.random() * (container.clientWidth - 200)}px`;

    // 完全なタイトルとグローバル名をデータ属性に保存
    block.setAttribute('data-full-title', input.title);
    block.setAttribute('data-full-globalname', globalName);
    block.setAttribute('data-id', globalId);
        
    // ブロックの中身を設定
    block.innerHTML = `<strong>${truncatedTitle}</strong><br>
                        <span style="display: block; font-size: ${globalNameFontSize}; 
                                    position: relative; top: ${globalNameTopOffset};">
                            ${truncatedGlobalName}
                        </span>`;

    // ツールチップを追加
    createTooltip(block.querySelector('strong'), input.title);
    createTooltip(block.querySelector('span'), globalName);

    input.parameters.forEach((param, index) => {
        const topPosition = offsetTop + index * nodeSpacing; // ノード間の行間隔を小さく設定

        const leftNode = document.createElement('div');
        leftNode.className = 'node left-node';
        leftNode.setAttribute('data-parameter', param);
        leftNode.setAttribute('data-value', input.values[index]);
        leftNode.setAttribute('data-block-id', block.id);
        leftNode.style.top = `${topPosition}px`;
        leftNode.style.left = '-5px';
        leftNode.addEventListener('mousedown', startConnection);

        const rightNode = document.createElement('div');
        rightNode.className = 'node right-node';
        rightNode.setAttribute('data-parameter', param);
        rightNode.setAttribute('data-value', input.values[index]);
        rightNode.setAttribute('data-block-id', block.id);
        rightNode.style.top = `${topPosition}px`;
        rightNode.style.left = '215px';
        rightNode.addEventListener('mousedown', startConnection);

        const inputBox = document.createElement('input');
        inputBox.className = 'parameter-input';
        inputBox.type = 'text';
        inputBox.value = input.values[index];
        inputBox.setAttribute('data-parameter', param);
        inputBox.style.left = '120px';
        inputBox.style.top = `${topPosition - 8}px`; // Adjust for proper alignment
        inputBox.style.position = 'absolute';
        //const leftPosition = parseInt(param.left) + 60; 
        //inputBox.style.left = `${leftPosition}px`;
        inputBox.style.width = '80px'

        // Add input event listener to update connections
        inputBox.addEventListener('input', () => {
            updateConnectionsForParameter(inputBox);
        });

        block.appendChild(inputBox);

        const leftLabel = document.createElement('label');
        leftLabel.className = 'node-label';
        leftLabel.textContent = `${param}:`;
        leftLabel.style.left = '15px';
        leftLabel.style.top = `${topPosition}px`;
        leftLabel.style.position = 'absolute';

        // `addBlock` 関数内の input.parameters.forEach の中に追加
        leftLabel.addEventListener('click', (e) => {
            e.stopPropagation();
            const rect = leftLabel.getBoundingClientRect();
            const x = rect.left + window.scrollX;
            const y = rect.top + window.scrollY;
            showPopup(input.title, globalName, param, inputBox.value, x, y);
        });

        block.appendChild(leftNode);
        block.appendChild(rightNode);
        block.appendChild(leftLabel);
    });

    block.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        deleteBlock(block);
    });

    container.appendChild(block);
    blocks.push(block);
    blockCounter++;
    setupDrag(block);
}


function updateDependencies(startNode, endNode) {
    if (endNode.classList.contains('left-node')) {
        const startValue = startNode.getAttribute('data-value');
        const param = endNode.getAttribute('data-parameter');
        const blockId = endNode.getAttribute('data-block-id');
        const block = document.getElementById(blockId);

        const inputBox = block.querySelector(`.parameter-input[data-parameter="${param}"]`);

        if (inputBox) {
            endNode.setAttribute('data-value', startValue);
            inputBox.value = startValue;
            inputBox.disabled = true; // 記入ボックスをロック
            inputBox.style.color = 'red'; // 文字の色を変更
            updateConnectedParameters(block, param, startValue); // 接続された全てのパラメータを更新
        } else {
            console.error('Input box not found for parameter:', param);
        }
    }
}

function updateConnectionsForParameter(inputBox) {
    const param = inputBox.getAttribute('data-parameter');
    const value = inputBox.value;
    const blockId = inputBox.parentNode.id;

    updateConnectedParameters(blockId, param, value);
}

function updateConnectedParameters(blockId, param, value) {
    connections.forEach(connection => {
        const startNode = connection.start;
        const endNode = connection.end;

        if (startNode.getAttribute('data-block-id') === blockId && startNode.getAttribute('data-parameter') === param) {
            updateParameter(endNode, value);
        } else if (endNode.getAttribute('data-block-id') === blockId && endNode.getAttribute('data-parameter') === param) {
            updateParameter(startNode, value);
        }
        
    });
}

function updateParameter(node, value) {
    const param = node.getAttribute('data-parameter');
    const blockId = node.getAttribute('data-block-id');
    const block = document.getElementById(blockId);
    const inputBox = block.querySelector(`.parameter-input[data-parameter="${param}"]`);

    if (inputBox) {
        node.setAttribute('data-value', value);
        inputBox.value = value;
        inputBox.disabled = true; // ロックを維持
        inputBox.style.color = 'red';

        // 左側ノードの更新後、右側ノードを取得して更新を伝播
        if (node.classList.contains('left-node')) {
            const rightNode = block.querySelector(`.right-node[data-parameter="${param}"]`);
            if (rightNode) {
                propagateUpdateFromRightNode(rightNode, value);
            }
        }
    }
}

function propagateUpdateFromRightNode(rightNode, value) {
    const param = rightNode.getAttribute('data-parameter');
    const blockId = rightNode.getAttribute('data-block-id');

    connections.forEach(connection => {
        if (connection.start === rightNode) {
            const endNode = connection.end;

            if (endNode.classList.contains('left-node')) {
                const endParam = endNode.getAttribute('data-parameter');
                const endBlockId = endNode.getAttribute('data-block-id');
                const endBlock = document.getElementById(endBlockId);
                const endInputBox = endBlock.querySelector(`.parameter-input[data-parameter="${endParam}"]`);

                if (endInputBox) {
                    endNode.setAttribute('data-value', value);
                    endInputBox.value = value;
                    endInputBox.disabled = true; // ロックを維持
                    endInputBox.style.color = 'red';

                    // 再帰的に更新を伝播
                    updateParameter(endNode, value);
                }
            }
        }
    });
}


function removeConnection(connection) {
    const endNode = connection.end;
    const param = endNode.getAttribute('data-parameter');
    const blockId = endNode.getAttribute('data-block-id');
    const block = document.getElementById(blockId);

    const inputBox = block.querySelector(`.parameter-input[data-parameter="${param}"]`);
    if (inputBox) {
        inputBox.disabled = false;
        inputBox.style.color = 'black';
    }
}

function deleteConnection(e) {
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
        if (dist <= 5) {
            removeConnection(connection);
            return false;
        }
        return true;
    });
    drawConnections();
}

canvas.addEventListener('contextmenu', deleteConnection);


function setupDrag(block) {
    block.addEventListener('mousedown', (e) => {
        if (e.target.className === 'block' || e.target.tagName === 'STRONG') {
            isDragging = true;
            selectedBlock = block;
            offsetX = e.clientX - block.offsetLeft;
            offsetY = e.clientY - block.offsetTop;
            block.style.zIndex = 1;
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            selectedBlock.style.left = `${e.clientX - offsetX}px`;
            selectedBlock.style.top = `${e.clientY - offsetY}px`;
            drawConnections();
        }
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            selectedBlock.style.zIndex = 0;
            selectedBlock = null;
        }
    });
}

function startConnection(e) {
    if (startNode === null) {
        startNode = e.target;
    } else {
        endNode = e.target;

        // 左ノードを先にクリックした場合
        if (startNode.classList.contains('left-node') && endNode.classList.contains('right-node')) {
            connections.push({ start: endNode, end: startNode });
            updateDependencies(endNode, startNode);
        }
        // 右ノードを先にクリックした場合
        else if (startNode.classList.contains('right-node') && endNode.classList.contains('left-node')) {
            connections.push({ start: startNode, end: endNode });
            updateDependencies(startNode, endNode);
        }
        drawConnections();
        startNode = null;
        endNode = null;

        
    }
    e.preventDefault();
}


function drawConnections() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    connections.forEach(connection => {
        const startRect = connection.start.getBoundingClientRect();
        const endRect = connection.end.getBoundingClientRect();
        const startX = startRect.left + startRect.width / 2 - container.offsetLeft;
        const startY = startRect.top + startRect.height / 2 - container.offsetTop;
        const endX = endRect.left + endRect.width / 2 - container.offsetLeft;
        const endY = endRect.top + endRect.height / 2 - container.offsetTop;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    });
}

function unlockConnectedParameters(block) {
    const blockId = block.id;
    const rightNodes = block.querySelectorAll('.right-node');

    rightNodes.forEach(rightNode => {
        const param = rightNode.getAttribute('data-parameter');
        const connectionsToRemove = [];

        connections.forEach(connection => {
            // 右ノードが接続元である場合
            if (connection.start === rightNode) {
                const endNode = connection.end;
                const endParam = endNode.getAttribute('data-parameter');
                const endBlockId = endNode.getAttribute('data-block-id');
                const endBlock = document.getElementById(endBlockId);

                // 接続先のパラメータテキストボックスをアンロックし、色を元に戻す
                const endInputBox = endBlock.querySelector(`.parameter-input[data-parameter="${endParam}"]`);
                if (endInputBox) {
                    endInputBox.disabled = false;
                    endInputBox.style.color = 'black';
                }

                // 接続の解除を記録
                connectionsToRemove.push(connection);
            }
        });

        // 接続リストから接続を削除
        connectionsToRemove.forEach(connection => {
            const index = connections.indexOf(connection);
            if (index > -1) {
                connections.splice(index, 1);
            }
        });
    });

    drawConnections();
}


function deleteBlock(block) {
    unlockConnectedParameters(block);
    const blockId = block.id;
    blocks = blocks.filter(b => b.id !== blockId);
    connections = connections.filter(connection => {
        return connection.start.closest('.block').id !== blockId &&
                connection.end.closest('.block').id !== blockId;
    });
    block.remove();
    drawConnections();
}

function clearAll() {
    blocks.forEach(block => block.remove());
    blocks = [];
    connections = [];
    drawConnections();
}

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


document.getElementById('saveImage').addEventListener('click', saveAsPNG);
document.getElementById('saveData').addEventListener('click', saveAsJSON);
document.getElementById('loadDataButton').addEventListener('click', () => document.getElementById('loadData').click());
document.getElementById('loadData').addEventListener('change', loadFromJSON);


function saveAsPNG() {
    // 影を削除するスタイルを追加
    blocks.forEach(block => {
        block.style.boxShadow = 'none';
        const inputBoxes = block.querySelectorAll('.parameter-input');
        inputBoxes.forEach(inputBox => {
            const param = inputBox.getAttribute('data-parameter');
            const value = inputBox.value;

            // 該当する `label` 要素を探してテキストを設定
            const labels = block.querySelectorAll('.node-label');
            labels.forEach(label => {
                if (label.textContent.startsWith(param + ":")) {
                    const correspondingNodeLists = block.querySelectorAll(`.node[data-parameter="${param}"]`);
                    const correspondingNode = Array.from(correspondingNodeLists).find(node => node.classList.contains('left-node'));
                    label.textContent = `${param}: ${value}`;
                    if (correspondingNode.classList.contains('left-node') && connections.some(conn => conn.end === correspondingNode)) {
                        label.style.color = 'red';
                    } else {
                        label.style.color = 'black';
                    }
                }
            });

            inputBox.style.display = 'none';
        });
    });

    // 現在のスタイルを保存
    const originalContainerStyle = {
        backgroundColor: container.style.backgroundColor,
        border: container.style.border
    };

    const originalCanvasStyle = {
        backgroundColor: canvas.style.backgroundColor
    };

    // `container` と `canvas` の背景色と枠線を透明にする
    container.style.backgroundColor = 'transparent';
    container.style.border = 'none';
    canvas.style.backgroundColor = 'transparent';

    // `container` の全領域をキャプチャ
    html2canvas(container, {
        scrollX: 0,
        scrollY: 0,
        width: container.scrollWidth,
        height: container.scrollHeight,
        backgroundColor: null // 背景を透明にする
    }).then(canvas => {
        // 元のスタイルを戻す
        container.style.backgroundColor = originalContainerStyle.backgroundColor;
        container.style.border = originalContainerStyle.border;
        canvas.style.backgroundColor = originalCanvasStyle.backgroundColor;

        blocks.forEach(block => {
            block.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
            const inputBoxes = block.querySelectorAll('.parameter-input');
            inputBoxes.forEach(inputBox => {
                inputBox.style.display = '';
                const param = inputBox.getAttribute('data-parameter');
                const labels = block.querySelectorAll('.node-label');
                labels.forEach(label => {
                    if (label.textContent.startsWith(param + ":")) {
                        label.textContent = `${param}:`;
                        label.style.color = 'black';
                    }
                });
            });
        });

        // PNGを保存
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = 'diagram.png';
        link.click();
    });
}

function saveAsJSON() {
    const data = {
        blocks: blocks.map(block => ({
            id: block.id,
            // データ属性から完全なタイトルとグローバル名を取得
            title: block.getAttribute('data-full-title'),
            globalName: block.getAttribute('data-full-globalname'),
            globalID: block.getAttribute('data-id'),
            style: {
                top: block.style.top,
                left: block.style.left,
                height: block.style.height,
                width: block.style.width
            },
            parameters: Array.from(block.querySelectorAll('.parameter-input')).map(input => ({
                parameter: input.getAttribute('data-parameter'),
                value: input.value,
                top: input.style.top,
                left: input.style.left
            }))
        })),
        connections: connections.map(connection => ({
            start: {
                blockId: connection.start.getAttribute('data-block-id'),
                parameter: connection.start.getAttribute('data-parameter')
            },
            end: {
                blockId: connection.end.getAttribute('data-block-id'),
                parameter: connection.end.getAttribute('data-parameter')
            }
        }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'diagram.json';
    link.click();
}        

function loadFromJSON(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const data = JSON.parse(e.target.result);
            clearAll();

            let maxGlobalId = 0;

            data.blocks.forEach(blockData => {
                const globalIdMatch = blockData.globalID;
                if (globalIdMatch) {
                    const globalId = parseInt(globalIdMatch, 10);
                    if (globalId > maxGlobalId) {
                        maxGlobalId = globalId;
                    }
                }
                addBlockFromData(blockData);
            });

            globalIdCounter = maxGlobalId;

            data.connections.forEach(connectionData => {
                createConnectionFromData(connectionData);
            });

            drawConnections();
        };

        reader.readAsText(file);
    }
}

function addBlockFromData(blockData) {

    const globalNameFontSize = '12px'; // GlobalName の文字サイズ
    const globalNameTopOffset = '-15px'; // GlobalName の表示位置のオフセット
    const offsetTop = 60; // ブロック上端から最初のノードまでのオフセット
    const nodeSpacing = 25; // ノード間の行間隔
    const blockHeight = blockData.parameters.length * nodeSpacing + 40;
    const maxTitleLength = 22; // タイトルの最大表示文字数
    const maxGlobalNameLength = 27; // タイトルの最大表示文字数
    const globalNameFrontLength = 12; // `GlobalName` の先頭表示文字数
    const globalNameBackLength = 12; // `GlobalName` の末尾表示文字数

    // タイトルと GlobalName をトリミング
    const truncatedTitle = truncateTitle(blockData.title, maxTitleLength);
    const inputString = blockData.title;
    const parts = inputString.split("::");
    const lastElement = parts[parts.length - 1];
    const globalName =  blockData.globalName;
    const truncatedGlobalName = truncateGlobalName(globalName, maxGlobalNameLength, globalNameFrontLength, globalNameBackLength);

    const block = document.createElement('div');
    block.className = 'block';
    block.id = blockData.id;
    block.style.top = blockData.style.top;
    block.style.left = blockData.style.left;
    block.style.height = blockData.style.height;
    block.style.width = blockData.style.width;

    block.setAttribute('data-full-title', blockData.title);
    block.setAttribute('data-full-globalname', globalName);
    block.setAttribute('data-id', blockData.globalID);

    // ブロックの中身を設定
    block.innerHTML = `<strong>${truncatedTitle}</strong><br>
                    <span style="display: block; font-size: ${globalNameFontSize}; 
                                    position: relative; top: ${globalNameTopOffset};">
                        ${truncatedGlobalName}
                    </span>`;

    // ツールチップを追加
    createTooltip(block.querySelector('strong'), blockData.title);
    createTooltip(block.querySelector('span'), globalName);


    blockData.parameters.forEach((param, index) => {

        const topPosition = offsetTop + index * nodeSpacing; 
        const inputBox = document.createElement('input');
        inputBox.className = 'parameter-input';
        inputBox.type = 'text';
        inputBox.value = param.value;
        inputBox.setAttribute('data-parameter', param.parameter);
        const leftPosition = parseInt(param.left); 
        inputBox.style.left = `${leftPosition}px`;
        inputBox.style.top = param.top;
        inputBox.style.position = 'absolute';
        inputBox.style.width = '80px'

        inputBox.addEventListener('input', () => {
            updateConnectionsForParameter(inputBox);
        });

        block.appendChild(inputBox);

        const leftNode = document.createElement('div');
        leftNode.className = 'node right-node';
        leftNode.setAttribute('data-parameter', param.parameter);
        leftNode.setAttribute('data-value', param.value);
        leftNode.setAttribute('data-block-id', block.id);
        leftNode.style.top = `${topPosition}px`;
        leftNode.style.left = '215px';
        leftNode.addEventListener('mousedown', startConnection);

        const rightNode = document.createElement('div');
        rightNode.className = 'node left-node';
        rightNode.setAttribute('data-parameter', param.parameter);
        rightNode.setAttribute('data-value', param.value);
        rightNode.setAttribute('data-block-id', block.id);
        rightNode.style.top = `${topPosition}px`;
        rightNode.style.left = '-5px';
        rightNode.addEventListener('mousedown', startConnection);

        const leftLabel = document.createElement('label');
        leftLabel.className = 'node-label';
        leftLabel.textContent = `${param.parameter}:`;
        leftLabel.style.left = '15px';
        leftLabel.style.top = `${topPosition}px`;
        leftLabel.style.position = 'absolute';

        // `addBlockFromData` 関数内の blockData.parameters.forEach の中に追加
        leftLabel.addEventListener('click', (e) => {
            e.stopPropagation();
            const rect = leftLabel.getBoundingClientRect();
            const x = rect.left + window.scrollX;
            const y = rect.top + window.scrollY;
            showPopup(blockData.title, blockData.globalName, param.parameter, inputBox.value, x, y);
        });

        block.appendChild(leftNode);
        block.appendChild(rightNode);
        block.appendChild(leftLabel);            
    });

    block.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        deleteBlock(block);
    });

    container.appendChild(block);
    blocks.push(block);
    setupDrag(block);
}

function createConnectionFromData(connectionData) {
    const startNode = document.querySelector(`.node.right-node[data-block-id="${connectionData.start.blockId}"][data-parameter="${connectionData.start.parameter}"]`);
    const endNode = document.querySelector(`.node.left-node[data-block-id="${connectionData.end.blockId}"][data-parameter="${connectionData.end.parameter}"]`);
    if (startNode && endNode) {
        connections.push({ start: startNode, end: endNode });
        updateDependencies(startNode, endNode);
    }
}