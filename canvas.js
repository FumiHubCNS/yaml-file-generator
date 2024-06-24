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

function addBlock(blockData) {
    functionMode = 0;
    globalId = 0;
    globalName = '';
    gtitle = '';

    if (blockData == null || blockData == undefined) {
        selectedInputIndex = inputSelect.value;
        blockData = inputs[selectedInputIndex];
        globalIdCounter++;
        globalId = globalIdCounter;

    } else {
        functionMode = 1;
        globalId = blockData.globalID
    }

    const offsetTop = 60; // ブロック上端から最初のノードまでのオフセット
    const nodeSpacing = 25; // ノード間の行間隔

    // ノードの間隔と数に応じたブロックの高さを計算
    
    const blockHeight = blockData.parameters.length * nodeSpacing + 40;

    // 表示する文字数の設定
    const maxTitleLength = 20; // タイトルの最大表示文字数
    const maxGlobalNameLength = 27; // タイトルの最大表示文字数
    const globalNameFrontLength = 12; // `GlobalName` の先頭表示文字数
    const globalNameBackLength = 12; // `GlobalName` の末尾表示文字数
        
    // GlobalName 表示のスタイル設定
    const globalNameFontSize = '12px'; // GlobalName の文字サイズ
    const globalNameTopOffset = '-15px'; // GlobalName の表示位置のオフセット

    // タイトルと GlobalName をトリミング
    const truncatedTitle = truncateTitle(blockData.title, maxTitleLength);
    const inputString = blockData.title;
    const parts = inputString.split("::");
    const lastElement = parts[parts.length - 1];

    const block = document.createElement('div');
    
    if (functionMode == 0){
        globalName = `My${lastElement}Num${globalId}`;
        block.className = 'block';
        block.id = `block${globalId}`;
        block.style.height = `${blockHeight}px`;
        block.style.top = `${Math.random() * (container.clientHeight - blockHeight)}px`;
        block.style.left = `${Math.random() * (container.clientWidth - 200)}px`;
    }else{
        globalName =  blockData.globalName;
        block.className = 'block';
        block.id = blockData.id;
        block.style.top = blockData.style.top;
        block.style.left = blockData.style.left;
        block.style.height = blockData.style.height;
        block.style.width = blockData.style.width;
    }
    
    const truncatedGlobalName = truncateGlobalName(globalName, maxGlobalNameLength, globalNameFrontLength, globalNameBackLength);

    // 完全なタイトルとグローバル名をデータ属性に保存
    block.setAttribute('data-full-title', blockData.title);
    block.setAttribute('data-full-globalname', globalName);
    block.setAttribute('data-id', globalId);
        
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
        prmName = '';
        prmValue = '';
        inputTextValue = '';
        inputTextPos = '';

        const topPosition = offsetTop + index * nodeSpacing; // ノード間の行間隔を小さく設定

        if (functionMode == 0){
            prmName  =  param;
            prmValue = blockData.values[index];
            inputTextValue = blockData.values[index];
            inputTextPos = '120px';
        }else{
            prmName = param.parameter;
            prmValue = param.value;
            inputTextValue = param.value;
            const leftPosition = parseInt(param.left); 
            inputTextPos = `${leftPosition}px`;
        }

        const leftNode = document.createElement('div');
        leftNode.className = 'node left-node';
        leftNode.setAttribute('data-parameter', prmName);
        leftNode.setAttribute('data-value', prmValue);
        leftNode.setAttribute('data-block-id', block.id);
        leftNode.style.top = `${topPosition}px`;
        leftNode.style.left = '-5px';
        leftNode.addEventListener('mousedown', startConnection);

        const rightNode = document.createElement('div');
        rightNode.className = 'node right-node';
        rightNode.setAttribute('data-parameter', prmName);
        rightNode.setAttribute('data-value', prmValue);
        rightNode.setAttribute('data-block-id', block.id);
        rightNode.style.top = `${topPosition}px`;
        rightNode.style.left = '215px';
        rightNode.addEventListener('mousedown', startConnection);

        const inputBox = document.createElement('input');
        inputBox.className = 'parameter-input';
        inputBox.type = 'text';
        inputBox.value = inputTextValue;
        inputBox.setAttribute('data-parameter', prmName);
        inputBox.style.left = inputTextPos;
        inputBox.style.top = `${topPosition - 8}px`; // Adjust for proper alignment
        inputBox.style.position = 'absolute';
        inputBox.style.width = '80px'

        // Add input event listener to update connections
        inputBox.addEventListener('input', () => {
            updateConnectionsForParameter(inputBox);
        });

        block.appendChild(inputBox);

        const leftLabel = document.createElement('label');
        leftLabel.className = 'node-label';
        leftLabel.textContent = `${prmName}:`;
        leftLabel.style.left = '15px';
        leftLabel.style.top = `${topPosition}px`;
        leftLabel.style.position = 'absolute';

        // `addBlock` 関数内の input.parameters.forEach の中に追加
        leftLabel.addEventListener('click', (e) => {
            e.stopPropagation();
            const rect = leftLabel.getBoundingClientRect();
            const x = rect.left + window.scrollX;
            const y = rect.top + window.scrollY;
            showPopup(blockData.title, globalName, prmName, inputBox.value, x, y);
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
    const scrollX = window.scrollX; // 横スクロールの量を取得
    const scrollY = window.scrollY; // 縦スクロールの量を取得

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    connections.forEach(connection => {
        const startRect = connection.start.getBoundingClientRect();
        const endRect = connection.end.getBoundingClientRect();
        const startX = startRect.left + startRect.width / 2 - container.offsetLeft + scrollX;
        const startY = startRect.top + startRect.height / 2 - container.offsetTop + scrollY;
        const endX = endRect.left + endRect.width / 2 - container.offsetLeft + scrollX;
        const endY = endRect.top + endRect.height / 2 - container.offsetTop + scrollY;

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

function searchAndShowResults() {
    const searchTerm = document.getElementById('searchText').value.trim();
    if (!searchTerm) {
        alert('Please enter a search term.');
        return;
    }

    const searchResults = inputs.filter(input => input.title.includes(searchTerm));
    
    if (searchResults.length > 0) {
        showSearchPopup(searchResults);
    } else {
        alert('No results found.');
    }
}

function setupDrag(block) {
    block.addEventListener('mousedown', (e) => {
        if (e.target.className.includes('block') || e.target.tagName === 'STRONG') {
            isDragging = true;
            selectedBlock = block;
            offsetX = e.clientX - block.offsetLeft;
            offsetY = e.clientY - block.offsetTop;
            block.style.zIndex = 1;

            if (block.classList.contains('movable')) {
                // グループ内のブロックを全て選択
                const groupId = block.dataset.groupId;
                selectedBlocks = document.querySelectorAll(`[data-group-id="${groupId}"]`);
            } else {
                selectedBlocks = [block]; // 単一ブロックのみ
            }
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const deltaX = e.clientX - offsetX;
            const deltaY = e.clientY - offsetY;
            selectedBlocks.forEach(block => {
                block.style.left = `${deltaX}px`;
                block.style.top = `${deltaY}px`;
            });
            drawConnections();
        }
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            selectedBlocks.forEach(block => {
                block.style.zIndex = 0;
            });
            selectedBlock = null;
            selectedBlocks = null;
        }
    });
}


function adjustCanvasSize() {
    const container = document.getElementById('container');
    const canvas = document.getElementById('canvas');

    // Set the canvas and container size to match the browser window
    container.style.width = window.innerWidth + 'px';
    container.style.height = window.innerHeight + 'px';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}



