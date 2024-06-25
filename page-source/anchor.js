function addAnchor(anchorName='label', anchorValue='value') {
    //addAnchor();
    const listContainer = document.getElementById('listContainer');
    const entryDiv = document.createElement('div');
    entryDiv.classList.add('entry');

    const nameLabel = document.createElement('input');
    nameLabel.type = 'text';
    nameLabel.value = anchorName;
    nameLabel.placeholder = 'Label';
    nameLabel.classList.add('labelInput');

    const valueInput = document.createElement('input');
    valueInput.type = 'text';
    valueInput.value = anchorValue;
    valueInput.placeholder = 'Value';
    valueInput.classList.add('valueInput');

    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove';
    removeButton.classList.add('removeButton');
    removeButton.addEventListener('click', () => {
        listContainer.removeChild(entryDiv);
    });

    entryDiv.appendChild(nameLabel);
    entryDiv.appendChild(valueInput);
    entryDiv.appendChild(removeButton);
    listContainer.appendChild(entryDiv);
}
