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

function showSearchPopup(results) {

    const existingPopup = document.querySelector('.search-popup');
    if (existingPopup) {
        existingPopup.remove();
    }

    const popup = document.createElement('div');
    popup.classList.add('search-popup');
    popup.innerHTML = `
        <div class="search-popup-header" style="display: flex; justify-content: space-between; align-items: center;">
            <h2 style="margin: 0; color: #00796b; flex-grow: 1;">Search Results</h2>
            <button class="closePopup" style="background: #d32f2f; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 5px;">X</button>
        </div>
        <div class="search-popup-content">
            <div class="table-container" style="width: 100%; max-height: 60vh; overflow-y: auto;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tbody id="resultsBody">
                    </tbody>
                </table>
            </div>
        </div>
    `;

    popup.querySelector('.closePopup').addEventListener('click', () => {
        popup.remove();
    });

    const resultsBody = popup.querySelector('#resultsBody');
    results.forEach((result, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong class="processername">${result.title}</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">
                <button class="addBlockButtonFromSearch" data-index="${index}" style="background: #00796b; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 5px;">Add Block</button>
            </td>
        `;
        resultsBody.appendChild(row);
    });

    popup.querySelectorAll('.addBlockButtonFromSearch').forEach(button => {
        button.addEventListener('click', () => {
            const row = button.closest('tr');
            const title = row.querySelector('td:first-child .processername').textContent;
            updateSelectByTitle(inputSelect, title); // セレクトを更新
            popup.remove(); // ポップアップを閉じる
            addBlock();
        });
    });        

    document.body.appendChild(popup);
}

function updateSelectByTitle(selectElement, title) {
    for (let i = 0; i < selectElement.options.length; i++) {
        if (selectElement.options[i].textContent === title) {
            selectElement.selectedIndex = i;
            console.log(`Selected option with title: ${title}`);
            return;
        }
    }
    console.error(`Option with title "${title}" not found`);
}


function showYAMLFilesPopup(yamlFilesContent) {
    const fileList = Object.keys(yamlFilesContent);
    const defaultFile = fileList[0];
    
    const popup = document.createElement('div');
    popup.classList.add('scrollable-popup');
    popup.innerHTML = `
        <div class="scrollable-popup-header">
            <h2>Generated YAML Files</h2>
            <button class="closePopup">X</button>
        </div>
        <div class="scrollable-popup-filelist">
            <h3>Select a YAML File:</h3>
            <select id="yamlFileSelect">
                ${fileList.map(fileName => `<option value="${fileName}">${fileName}</option>`).join('')}
            </select>
            <button id="copyYAMLContent" class="copyYAML">Copy YAML Content</button>
        </div>
        <div class="scrollable-popup-content">
            ${fileList.map(fileName => `
                <div class="yaml-file-section" id="section-${fileName}" style="display: none;">
                    <h3>${fileName}</h3>
                    <select class="view-select" data-file="${fileName}">
                        <option value="content" selected>View Content</option>
                        <option value="structure">View Structure</option>
                    </select>
                    <div class="yaml-file-content" id="content-${fileName}">
                        <pre>${yamlFilesContent[fileName]}</pre>
                    </div>
                    <div class="yaml-file-structure" id="structure-${fileName}" style="display: none;">
                        <table>
                            <thead>
                                <tr><th>Type</th><th>Name</th></tr>
                            </thead>
                            <tbody>
                                ${yamlFilesContent[fileName].split('\n').map(line => {
                                    const trimmedLine = line.trim();
                                    if (trimmedLine.startsWith('name:') || trimmedLine.startsWith('- name:')) {
                                        const parts = line.split(':');
                                        if (parts.length > 1) {
                                            const typeraw = parts[0].trim();
                                            let type = 'Processor';
                                            if(typeraw === 'name'){
                                                type = 'Include File';
                                            }
                                            const name = parts[1].trim();
                                            return `<tr><td>${type}</td><td>${name}</td></tr>`;
                                        }
                                    }
                                    return '';
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    document.body.appendChild(popup);

    // 初期表示ファイルを設定
    document.getElementById(`section-${defaultFile}`).style.display = 'block';

    // ファイル選択ボックスのイベントリスナー
    document.getElementById('yamlFileSelect').addEventListener('change', event => {
        const selectedFile = event.target.value;
        fileList.forEach(fileName => {
            document.getElementById(`section-${fileName}`).style.display = 'none';
        });
        document.getElementById(`section-${selectedFile}`).style.display = 'block';
    });

    // View選択ボックスのイベントリスナー
    document.querySelectorAll('.view-select').forEach(select => {
        select.addEventListener('change', event => {
            const fileName = event.target.dataset.file;
            const value = event.target.value;
            document.getElementById(`content-${fileName}`).style.display = value === 'content' ? 'block' : 'none';
            document.getElementById(`structure-${fileName}`).style.display = value === 'structure' ? 'block' : 'none';
        });
    });

    // コピー機能
    document.getElementById('copyYAMLContent').addEventListener('click', () => {
        const selectedFile = document.getElementById('yamlFileSelect').value;
        const yamlContent = document.getElementById(`content-${selectedFile}`).querySelector('pre').textContent
        navigator.clipboard.writeText(yamlContent).then(() => alert(`${selectedFile} content copied to clipboard`));
    });

    // 閉じるボタン
    popup.querySelector('.closePopup').addEventListener('click', () => popup.remove());
}
