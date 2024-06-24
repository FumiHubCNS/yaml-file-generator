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
        groups: Array.from(document.querySelectorAll('[data-group-id]')).reduce((groups, block) => {
            const groupId = block.getAttribute('data-group-id');
            const groupLabel = block.getAttribute('data-group-label');
            const groupColor = getComputedStyle(block).backgroundColor;

            if (!groups[groupId]) {
                groups[groupId] = { id: groupId, label: groupLabel, color: groupColor, blocks: [], parameters: {} };
            }
            groups[groupId].blocks.push(block.id);
            groups[groupId].parameters = groupParameters[groupId] || {}; // グループパラメータを追加
            return groups;
        }, {}),
        anchors: Array.from(document.querySelectorAll('#listContainer .entry')).map(entry => ({
            name: entry.querySelector('.labelInput').value,
            value: entry.querySelector('.valueInput').value
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
                addBlock(blockData);
            });

            if (data.anchors) {
                data.anchors.forEach(anchor => {
                    addAnchor(anchor.name, anchor.value);
                });
            }

            globalIdCounter = maxGlobalId;

            data.connections.forEach(connectionData => {
                createConnectionFromData(connectionData);
            });

            if (data.groups) {
                Object.values(data.groups).forEach(group => {
                    group.blocks.forEach(blockId => {
                        const block = document.getElementById(blockId);
                        if (block) {
                            block.dataset.groupId = group.id;
                            block.dataset.groupLabel = group.label;
                            block.style.backgroundColor = group.color;
                        }
                    });
                    addGroupInfoToTable(group.id, group.label, group.color);

                    // グループパラメータの読み込み
                    groupParameters[group.id] = group.parameters || {};

                });
            }

            drawConnections();
        };

        reader.readAsText(file);
    }
}

function createConnectionFromData(connectionData) {
    const startNode = document.querySelector(`.node.right-node[data-block-id="${connectionData.start.blockId}"][data-parameter="${connectionData.start.parameter}"]`);
    const endNode = document.querySelector(`.node.left-node[data-block-id="${connectionData.end.blockId}"][data-parameter="${connectionData.end.parameter}"]`);
    if (startNode && endNode) {
        connections.push({ start: startNode, end: endNode });
        updateDependencies(startNode, endNode);
    }
}

function addFromJSON(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const newData = JSON.parse(e.target.result);
            const existingGroupIds = new Set(Object.keys(groupParameters));
            const existingGroupLabels = new Set(Object.values(groupParameters).map(group => group.label));
            const existingBlockIds = new Set(blocks.map(block => block.id));
            const existingGlobalNames = new Set(blocks.map(block => block.getAttribute('data-full-globalname')));
            const existingGlobalIDs = new Set(blocks.map(block => block.getAttribute('data-id')));

            let maxGlobalId = globalIdCounter;
            let groupIdSuffixCounter = 1;
            let blockIdSuffixCounter = 1;
            let PairLists =[];

            newData.blocks.forEach(blockData => {
                const globalIdMatch = blockData.globalID;

                let blockIdSuffixCounterAll = 0;
                let newBlockId = blockData.id;
                let newGlobalName = blockData.globalName;
                let newGlobalID = blockData.globalID;

                // 衝突を避けるためにユニークなIDと名前を生成
                while (existingBlockIds.has(newBlockId)) {
                    newBlockId = `${blockData.id}_${blockIdSuffixCounter}`;
                    blockIdSuffixCounterAll++;
                }

                while (existingGlobalNames.has(newGlobalName)) {
                    newGlobalName = `${blockData.globalName}_${blockIdSuffixCounter}`;
                    blockIdSuffixCounterAll++;
                }

                while (existingGlobalIDs.has(newGlobalID)) {
                    newGlobalID = `${blockData.globalID}_${blockIdSuffixCounter}`;
                    blockIdSuffixCounterAll++;
                }

                let existingNamePair =[blockData.id,`_${blockIdSuffixCounter}`];
                PairLists.push(existingNamePair);

                blockData.id = newBlockId;
                blockData.globalName = newGlobalName;
                blockData.globalID = newGlobalID;

                if(blockIdSuffixCounterAll > 0 ){
                    blockIdSuffixCounter++;
                }
                
                addBlock(blockData); // 既存の関数を使用してブロックを追加

                if (globalIdMatch) {
                    const globalId = parseInt(globalIdMatch, 10);
                    if (globalId > maxGlobalId) {
                        maxGlobalId = globalId;
                    }
                }

            });

            globalIdCounter = maxGlobalId;

            if (newData.anchors) {
                newData.anchors.forEach(anchor => {
                    addAnchor(anchor.name, anchor.value);
                });
            }

            // グループの追加
            if (newData.groups) {
                let groupidcounter = 0;

                Object.values(newData.groups).forEach(group => {
                    let newGroupId = group.id;
                    let newGroupLabel = group.label;
                    let newGroupColor = group.color;

                    // グループIDが既存と衝突した場合の処理
                    while (existingGroupIds.has(newGroupId)) {
                        newGroupId = `${group.id}_${groupIdSuffixCounter}`;
                        newGroupLabel = `${group.label}_${groupIdSuffixCounter}`;
                        newGroupColor = generateRandomRgbaColor(0.5);
                        groupIdSuffixCounter++;
                    }

                    existingGroupIds.add(newGroupId);
                    existingGroupLabels.add(newGroupLabel);

                    // グループ情報をテーブルに追加
                    addGroupInfoToTable(newGroupId, newGroupLabel, newGroupColor);
                    groupParameters[newGroupId] = group.parameters || {}; // パラメータを設定
                    
                    // ブロックを新しいグループに追加
                    group.blocks.forEach(blockId => {
                        //const block = document.getElementById(blockId);
                        let tempPairLists = PairLists.filter(row => !row.includes(`${blockId}`));
                        let matchedPairLists = PairLists.filter(row => row.includes(`${blockId}`));
                        PairLists = tempPairLists;

                        if(matchedPairLists.length > 0){
                            const block = document.getElementById(`${matchedPairLists[0].join("")}`);
                            block.dataset.groupId = newGroupId;
                            block.dataset.groupLabel = newGroupLabel;
                            block.style.backgroundColor = newGroupColor;
                        }
                    
                    });
                

                    groupidcounter++;

                });
            }

            newData.connections.forEach(connectionData => {
                createConnectionFromData(connectionData);
            });
            

            drawConnections();
        };

        reader.readAsText(file);
    }

}

function removeRowsContainingString(array, target) {
    return array.filter(row => !row.includes(target));
}

// output.jsの修正
function generateYAMLFiles() {
    const yamlFilesContent = {};
    const blocksByGroup = {};

    // グループ分けしてソート
    blocks.forEach(block => {
        const groupId = block.dataset.groupId || 'main';
        if (!blocksByGroup[groupId]) {
            blocksByGroup[groupId] = [];
        }
        blocksByGroup[groupId].push(block);
    });

    const blocksByGroupDummy = blocksByGroup;
    let insertGroupPositions =[];
    Object.keys(blocksByGroupDummy).forEach(groupId => {
        const blocks = blocksByGroupDummy[groupId];
        blocks.sort((a, b) => {
            const ax = parseFloat(a.style.left);
            const ay = parseFloat(a.style.top);
            const bx = parseFloat(b.style.left);
            const by = parseFloat(b.style.top);

            return ax - bx || ay - by;
        });

        // グループ情報を保存
        if (groupId !== 'main') {

            insertGroupPositions.push(blocks[0]);
        }
    });

    // 各グループのYAMLファイルの内容をテキストで生成
    Object.keys(blocksByGroup).forEach(groupId => {
        const blocks = blocksByGroup[groupId];
        blocks.sort((a, b) => {
            const ax = parseFloat(a.style.left);
            const ay = parseFloat(a.style.top);
            const bx = parseFloat(b.style.left);
            const by = parseFloat(b.style.top);

            return ax - bx || ay - by;
        });

        if (groupId === 'main') {
            // main.yaml の内容を生成
            const yamlContent = generateMainYAML(blocks, insertGroupPositions);
            yamlFilesContent['main.yaml'] = yamlContent;
        } else {
            // グループのYAMLファイルを生成
            const yamlContent = generateYAMLContent(blocks);
            const fileName = getGroupLabelById(`${groupId}`);
            yamlFilesContent[fileName] = yamlContent;
        }
    });

    return yamlFilesContent;
}

function generateYAMLContent(blocks) {
    const processors = [];

    blocks.forEach(block => {
        const globalName = block.getAttribute('data-full-globalname');
        const title = block.getAttribute('data-full-title');
        const parameters = Array.from(block.querySelectorAll('.parameter-input')).map(input => {
            const param = input.getAttribute('data-parameter');
            const value = input.value;
            return `      ${param}: ${value}`; // 正しいインデントを適用
        }).join('\n');

        processors.push(`
  - name: ${globalName}
    type: ${title}
    parameter:
${parameters}`); // `type:`と`parameter:`もインデントを下げ、さらに`parameter:`の下もインデントを下げる
    });

    const yamlContent = `Processor:\n${processors.join('\n')}`;
    return yamlContent;
}

function generateMainYAML(blocks, mostLeftBlocks) {
    const anchors = generateAnchorContent();
    const processors = [];
    const includes = [];

    // グループ化されていないブロックをProcessorとして追加
    blocks.forEach(block => {
        if (!block.dataset.groupId) {  // グループ化されていないブロック
            const globalName = block.getAttribute('data-full-globalname');
            const title = block.getAttribute('data-full-title');
            const parameters = Array.from(block.querySelectorAll('.parameter-input')).map(input => {
                const param = input.getAttribute('data-parameter');
                const value = input.value;
                return `      ${param}: ${value}`; // 正しいインデントを適用
            }).join('\n');

            // 配列を逆順でループ
            for (let i = mostLeftBlocks.length - 1; i >= 0; i--) {
                if(isLeftOrTopLeft(mostLeftBlocks[i], block)){

                    let groupindex = 0;
                    groupcollection = document.getElementById('groupInfoTable').getElementsByClassName('group-color-cell')
                    groupcollectionIds = Array.from(groupcollection).map(td => td.getAttribute('data-group-id'));
                    groupcollectionLabels = Array.from(groupcollection).map(td => td.getAttribute('data-group-label'));

                    groupcollectionIds.forEach(groupcollectionId => {

                        let parameters =[];

                        collectionprmsdata= groupParameters[`${groupcollectionId}`];
                        collectionprms = Object.entries(collectionprmsdata);
                        collectionprms.forEach(([key, value]) => {
                            parameters.push(`        ${key}: ${value}`);
                        });

                    if(`${parameters.join('\n')}` !== '' ){
                        processors.push(`
  - include:
      name: ${groupcollectionLabels[groupindex]}
      replace:
${parameters.join('\n')}`);
                    }else{
                        processors.push(`\n  - include: ${groupcollectionLabels[groupindex]}`);
                    }

                    // 要素を削除
                    mostLeftBlocks.splice(i, 1);
                    groupindex++;
                    });
                }
            }

            processors.push(`
  - name: ${globalName}
    type: ${title}
    parameter:
${parameters}`); 
        }
    });

    const yamlContent = `Anchor:\n${anchors.join('\n')}\n\nProcessor:\n${processors.join('\n')}\n${includes.join('\n')}`;
    return yamlContent;
}

function generateAnchorContent() {
    const anchors = [];
    const anchorElements = document.querySelectorAll('.entry');

    anchorElements.forEach(anchorElement => {
        const name = anchorElement.querySelector('.labelInput').value;
        const value = anchorElement.querySelector('.valueInput').value;
        anchors.push(`  - &${name} ${value}`);
    });

    return anchors;
}


// output.jsに修正
function findLeftMostBlock(blocks) {
    return blocks.reduce((leftMost, block) => {
        if (!leftMost || parseFloat(block.style.left) < parseFloat(leftMost.style.left)) {
            return block;
        }
        return leftMost;
    }, null);
}


// YAMLをダウンロードする関数
function downloadYAML(fileName, content) {
    const blob = new Blob([content], { type: 'application/x-yaml' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
}

// 複数のYAMLファイルをZIPでダウンロードする関数
function downloadYAMLAsZip(yamlFilesContent) {
    const zip = new JSZip();
    Object.keys(yamlFilesContent).forEach(fileName => {
        zip.file(fileName, yamlFilesContent[fileName]);
    });

    zip.generateAsync({ type: 'blob' }).then(content => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = 'yaml_files.zip';
        link.click();
    });
}

function isLeftOrTopLeft(divA, divB) {
    // style.topとstyle.leftを数値に変換
    const topA = parseFloat(divA.style.top);
    const leftA = parseFloat(divA.style.left);
    const topB = parseFloat(divB.style.top);
    const leftB = parseFloat(divB.style.left);

    // divAがdivBの左または同じleft値で上にあるかを判定
    if (leftA < leftB) {
        return true;
    } else if (leftA === leftB && topA < topB) {
        return true;
    }
    return false;
}

function getGroupLabelById(groupId) {
    // HTMLCollectionを取得
    const cells = document.getElementById('groupInfoTable').getElementsByClassName('group-color-cell');

    // HTMLCollectionを配列に変換してから処理する
    const cellArray = Array.from(cells);

    // 指定されたgroupIdに一致するdata-group-labelを検索
    const groupLabel = cellArray.find(cell => cell.dataset.groupId === groupId)?.dataset.groupLabel;

    if(!groupLabel){
        alert("Can not find file name.");
    }
    

    return groupLabel;
}