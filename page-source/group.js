document.addEventListener('DOMContentLoaded', () => {
    const selectedBlocks = new Set(); // 選択されたブロックを保持するセット
    const originalColors = new Map(); // 元の色を保持するマップ

    document.addEventListener('click', (event) => {
        if (event.shiftKey) {
            const clickedElement = event.target;
            if (clickedElement.classList.contains('block')) {
                const blockId = clickedElement.id;

                if (selectedBlocks.has(blockId)) {
                    // 選択解除
                    selectedBlocks.delete(blockId);
                    clickedElement.style.backgroundColor = 'rgba(173, 216, 230, 0.5)'; // 元の色に戻す
                } else {
                    // 選択
                    selectedBlocks.add(blockId);
                    clickedElement.style.backgroundColor = 'rgba(255, 165, 0, 0.5)'; // 選択された色に変える
                }

                updateSelectedBlocksList(selectedBlocks);
            }
        }
    });

    // グループ化ボタンのクリックイベント
    document.getElementById('groupBlocks').addEventListener('click', () => {
        if (selectedBlocks.size > 0) {
            const groupId = `group${groupCounter}`;
            const groupLabel = `Group ${groupCounter}`;

            const groupColor = generateRandomRgbaColor(0.5); // 50%透過の色を生成
            selectedBlocks.forEach(blockId => {
                const block = document.getElementById(blockId);
                block.dataset.groupId = groupId;
                block.dataset.groupLabel = groupLabel;
                if (!originalColors.has(blockId)) {
                    originalColors.set(blockId, `rgba(173, 216, 230, 0.5)`);
                }
            });

            addGroupInfoToTable(groupId, groupLabel, groupColor);
            groupParameters[groupId] = {}; // 初期のパラメータを空で設定
            clearSelectedBlocks();
            groupCounter++;
        } else {
            alert("No blocks selected for grouping.");
        }
    });

    function updateSelectedBlocksList(blocksSet) {
        console.clear(); // コンソールをクリア
    }

    function clearSelectedBlocks() {
        selectedBlocks.forEach(blockId => {
            const block = document.getElementById(blockId);
            block.style.backgroundColor = 'rgba(173, 216, 230, 0.5)'; // 元の色に戻す
        });
        selectedBlocks.clear();
    }

    function addGroupInfoToTable(groupId, groupLabel, color) {
        const tableBody = document.getElementById('groupInfoTable').querySelector('tbody');
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="group-color-cell" data-group-id="${groupId}" data-group-label="${groupLabel}" style="background-color: ${color};"></td>
            <td><input type="text" class="editable" value="${groupId}" oninput="updateGroupId(this, '${groupId}')"></td>
            <td><input type="text" class="editable" value="${groupLabel}" oninput="updateGroupLabel(this, '${groupId}')"></td>
            <td><button onclick="toggleGroupColor('${groupId}', '${color}')">Check Color</button></td>
            <td><button onclick="addToGroup('${groupId}')">Add to Group</button></td>
            <td><button onclick="deleteGroup('${groupId}')">Delete Group</button></td>
            <td><button onclick="showGroupParameters('${groupId}')">Parameters</button></td>
        `;
        tableBody.appendChild(row);
    }

    function generateRandomRgbaColor(opacity) {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    window.toggleGroupColor = function(groupId, color) {
        const blocks = document.querySelectorAll(`[data-group-id="${groupId}"]`);
        blocks.forEach(block => {
            const blockId = block.id;
            const currentColor = getComputedStyle(block).backgroundColor;
            const classFlag = block.className === 'block';
            if(classFlag){
                if (currentColor === color) {
                    block.style.backgroundColor = originalColors.get(blockId) || 'rgba(173, 216, 230, 0.5)'; // 元の色に戻す
                } else {
                    block.style.backgroundColor = color;
                }
            }
        });
    };

    window.updateGroupId = function(inputElement, oldGroupId) {
        const newGroupId = inputElement.value;
        const blocks = document.querySelectorAll(`[data-group-id="${oldGroupId}"]`);
        blocks.forEach(íblock => {
            block.dataset.groupId = newGroupId;
        });
        updateTableGroupId(oldGroupId, newGroupId);
        if (groupParameters[oldGroupId]) {
            groupParameters[newGroupId] = groupParameters[oldGroupId];
            delete groupParameters[oldGroupId];
        }
    };

    window.updateGroupLabel = function(inputElement, groupId) {
        const newGroupLabel = inputElement.value;
        const blocks = document.querySelectorAll(`[data-group-id="${groupId}"]`);
        blocks.forEach(block => {
            block.dataset.groupLabel = newGroupLabel;
        });
    };

    window.enableGroupMove = function(groupId) {
        const blocks = document.querySelectorAll(`[data-group-id="${groupId}"]`);
        blocks.forEach(block => {
            block.classList.add('movable'); // movableクラスを追加してドラッグ対象に
        });
    };

    window.disableGroupMove = function(groupId) {
        const blocks = document.querySelectorAll(`[data-group-id="${groupId}"]`);
        blocks.forEach(block => {
            block.classList.remove('movable'); // movableクラスを削除してドラッグ対象から外す
        });
    };

    function updateTableGroupId(oldGroupId, newGroupId) {
        const rows = document.querySelectorAll(`#groupInfoTable tbody tr`);
        rows.forEach(row => {
            const idInput = row.cells[1].querySelector('input');
            if (idInput && idInput.value === oldGroupId) {
                idInput.value = newGroupId;
            }
        });
    };

    window.addToGroup = function(groupId) {
        if (selectedBlocks.size > 0) {
            const groupColor = document.querySelector(`[class="block"][data-group-id="${groupId}" ]`).style.backgroundColor;
            selectedBlocks.forEach(blockId => {
                const block = document.getElementById(blockId);
                block.dataset.groupId = groupId;
                block.style.backgroundColor = groupColor;
            });
            selectedBlocks.clear();
        } else {
            alert("No blocks selected to add to the group.");
        }
    };


    window.deleteGroup = function(groupId) {
        // グループに所属するブロックを取得
        const groupBlocks = document.querySelectorAll(`[data-group-id="${groupId}"]`);
        groupBlocks.forEach(block => {
            // グループ情報を解除し、元の背景色に戻す
            block.removeAttribute('data-group-id');
            block.removeAttribute('data-group-label');
            block.style.backgroundColor = 'rgba(173, 216, 230, 0.5)'; // 元の色に戻す
        });
        
        gtable =  document.getElementById('groupInfoTable');
        gtableRows = Array.from(gtable.rows);
        
        gtableRows.forEach(gtableRow => {
            const removeFlag = gtableRow.querySelector(`[value="${groupId}"]`)  !== null;
            if(removeFlag == true){
                gtable.deleteRow(gtableRow.rowIndex);
            }
        });

        delete groupParameters[groupId];

    };

    window.showGroupParameters = function(groupId) {
        const groupParam = groupParameters[groupId] || {};

        const headingPosition = document.getElementById('groupInfoSection').getBoundingClientRect();

        // ポップアップを作成
        const popup = document.createElement('div');
        popup.classList.add('popup');
        popup.style.top = `${headingPosition.top}px`;

        popup.innerHTML = `
            <h2>Parameters for Group ${groupId}</h2>
            <table id="paramTable">
                <thead>
                    <tr>
                        <th>Parameter Name</th>
                        <th>Value</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.keys(groupParam).map(paramName => `
                        <tr>
                            <td><input type="text" class="paramName" value="${paramName}"></td>
                            <td><input type="text" class="paramValue" value="${groupParam[paramName]}"></td>
                            <td><button class="deleteParam">Delete</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <button id="addParam">Add Parameter</button>
            <button class="closePopup">Close</button>
        `;

        // パラメータを削除するイベントを追加
        popup.querySelectorAll('.deleteParam').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const row = e.target.closest('tr');
                row.remove();
            });
        });

        // パラメータを追加するイベントを追加
        popup.querySelector('#addParam').addEventListener('click', () => {
            const tableBody = popup.querySelector('#paramTable tbody');
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td><input type="text" class="paramName" value=""></td>
                <td><input type="text" class="paramValue" value=""></td>
                <td><button class="deleteParam">Delete</button></td>
            `;
            tableBody.appendChild(newRow);

            // 新しい行の削除ボタンにイベントを追加
            newRow.querySelector('.deleteParam').addEventListener('click', (e) => {
                const row = e.target.closest('tr');
                row.remove();
            });
        });

        // ポップアップを閉じるイベントを追加
        popup.querySelector('.closePopup').addEventListener('click', () => {
            const paramTableRows = popup.querySelectorAll('#paramTable tbody tr');
            groupParameters[groupId] = {};

            paramTableRows.forEach(row => {
                const paramName = row.querySelector('.paramName').value.trim();
                const paramValue = row.querySelector('.paramValue').value.trim();
                if (paramName) {
                    groupParameters[groupId][paramName] = paramValue;
                }
            });

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

        };

});

function addGroupInfoToTable(groupId, groupLabel, color) {
    const tableBody = document.getElementById('groupInfoTable').querySelector('tbody');
    const row = document.createElement('tr');

    row.innerHTML = `
    <td class="group-color-cell" data-group-id="${groupId}" data-group-label="${groupLabel}" style="background-color: ${color};"></td>
    <td><input type="text" class="editable" value="${groupId}" oninput="updateGroupId(this, '${groupId}')"></td>
    <td><input type="text" class="editable" value="${groupLabel}" oninput="updateGroupLabel(this, '${groupId}')"></td>
    <td><button onclick="toggleGroupColor('${groupId}', '${color}')">Check Color</button></td>
    <td><button onclick="addToGroup('${groupId}')">Add to Group</button></td>
    <td><button onclick="deleteGroup('${groupId}')">Delete Group</button></td>
    <td><button onclick="showGroupParameters('${groupId}')">Parameters</button></td>
    `;

    tableBody.appendChild(row);
}

function generateRandomRgbaColor(opacity) {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}