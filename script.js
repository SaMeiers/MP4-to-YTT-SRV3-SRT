document.addEventListener('DOMContentLoaded', function() {
    const videoFileInput = document.getElementById('videoFile');
    const fpsInput = document.getElementById('fps');
    const columnsInput = document.getElementById('columns');
    const charSetInput = document.getElementById('charSet');
    const customCharSetGroup = document.getElementById('customCharSetGroup');
    const customCharSetInput = document.getElementById('customCharSet');
    const msOffsetInput = document.getElementById('msOffset');
    const idOffsetInput = document.getElementById('idOffset');
    const exportFormat = document.getElementById('exportFormat');
    const convertBtn = document.getElementById('convertBtn');
    const sampleBtn = document.getElementById('sampleBtn');
    const previewBox = document.getElementById('previewBox');
    const progressContainer = document.getElementById('progressContainer');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const statusText = document.getElementById('statusText');
    const downloadSection = document.getElementById('downloadSection');
    const downloadBtn = document.getElementById('downloadBtn');
    const fileInfo = document.getElementById('fileInfo');
    
    const selectSelected = document.getElementById('selectSelected');
    const selectItems = document.getElementById('selectItems');
    const selectOptions = document.querySelectorAll('.select-option');
    
    let currentCharSet = charSetInput.value;
    let isSelectOpen = false;
    
    function initCustomSelect() {
    selectSelected.addEventListener('click', function(e) {
        e.stopPropagation();
        isSelectOpen = !isSelectOpen;
        
        if (isSelectOpen) {
            selectSelected.classList.add('active');
            selectItems.classList.add('open');
        } else {
            selectSelected.classList.remove('active');
            selectItems.classList.remove('open');
        }
    });
    
    selectOptions.forEach(option => {
        option.addEventListener('click', function() {
            const value = this.getAttribute('data-value');
            const optionName = this.querySelector('.option-name').textContent;
            const optionChars = this.querySelector('.option-chars').textContent;
            
            selectSelected.querySelector('.selected-text').textContent = optionName;
            charSetInput.value = value;
            currentCharSet = value;
            
            selectOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            
            if (value === 'custom') {
                customCharSetGroup.style.display = 'block';
            } else {
                customCharSetGroup.style.display = 'none';
            }
            
            isSelectOpen = false;
            selectSelected.classList.remove('active');
            selectItems.classList.remove('open');
        });
    });
    
    document.addEventListener('click', function() {
        isSelectOpen = false;
        selectSelected.classList.remove('active');
        selectItems.classList.remove('open');
    });
    
    selectItems.addEventListener('click', function(e) {
        e.stopPropagation();
    });
    
    const initialOption = Array.from(selectOptions).find(option => 
        option.getAttribute('data-value') === charSetInput.value
    );
    if (initialOption) {
        initialOption.classList.add('selected');
        selectSelected.querySelector('.selected-text').textContent = initialOption.querySelector('.option-name').textContent;
    }
}
    
    initCustomSelect();
    
    sampleBtn.addEventListener('click', showAsciiSample);
    
    convertBtn.addEventListener('click', startConversion);
    
    downloadBtn.addEventListener('click', downloadFile);
    
    function showAsciiSample() {
        const sample = `
8888888b.   .d8888b.  888b     d888 8888888b.  
888   Y88b d88P  Y88b 8888b   d8888 888   Y88b 
888    888 888    888 88888b.d88888 888    888 
888   d88P 888        888Y88888P888 888   d88P 
8888888P"  888        888 Y888P 888 8888888P"  
888        888    888 888  Y8P  888 888        
888        Y88b  d88P 888   "   888 888        
888         "Y8888P"  888       888 888        
                                                   
8888888888 888     888 8888888888 888b    888 
888        888     888 888        8888b   888 
888        888     888 888        88888b  888 
8888888    Y88b   d88P 8888888    888Y88b 888 
888         Y88b d88P  888        888 Y88b888 
888          Y88o88P   888        888  Y88888 
888           Y888P    888        888   Y8888 
888            Y8P     8888888888 888    Y888 

                `.trim();
                
        previewBox.innerHTML = `<div class="ascii-art">${sample}</div>`;
    }
    
    function msToTimeFormat(ms) {
        ms = parseInt(ms);
        const hours = Math.floor(ms / 3600000);
        ms %= 3600000;
        const minutes = Math.floor(ms / 60000);
        ms %= 60000;
        const seconds = Math.floor(ms / 1000);
        const milliseconds = ms % 1000;
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
    }

    function msToASSFormat(ms) {
        ms = parseInt(ms);
        const hours = Math.floor(ms / 3600000);
        ms %= 3600000;
        const minutes = Math.floor(ms / 60000);
        ms %= 60000;
        const seconds = Math.floor(ms / 1000);
        const centiseconds = Math.floor((ms % 1000) / 10);
        
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
    }

    function msToYTTFormat(ms) {
        return Math.round(ms);
    }

    function getRegionData(imageData, x1, y1, x2, y2) {
        let totalLum = 0;
        let count = 0;
        
        for (let y = y1; y < y2; y++) {
            for (let x = x1; x < x2; x++) {
                const idx = (y * imageData.width + x) * 4;
                const r = imageData.data[idx];
                const g = imageData.data[idx + 1];
                const b = imageData.data[idx + 2];
                
                const gray = 0.299 * r + 0.587 * g + 0.114 * b;
                totalLum += gray;
                count++;
            }
        }
        
        return totalLum / count;
    }
    
    function convertImageToAscii(imageData, cols, charSet) {
        const width = imageData.width;
        const height = imageData.height;
        const maxRows = 12;
        const aspectRatio = width / height;
        let rows = Math.min(maxRows, Math.floor(cols / aspectRatio * 0.43));
        
        if (cols > width || rows > height) {
            throw new Error("La imagen es demasiado pequeña para las columnas especificadas");
        }
        
        const w = width / cols;
        const h = height / rows;
        
        const aimg = [];
        
        for (let j = 0; j < rows; j++) {
            const y1 = Math.floor(j * h);
            const y2 = Math.min(Math.floor((j + 1) * h), height);
            
            let row = "";
            
            for (let i = 0; i < cols; i++) {
                const x1 = Math.floor(i * w);
                const x2 = Math.min(Math.floor((i + 1) * w), width);
                
                const avgLum = getRegionData(imageData, x1, y1, x2, y2);
                
                const charIndex = Math.floor(((255 - avgLum) * (charSet.length - 1)) / 255);
                let gsval = charSet[Math.min(charSet.length - 1, charIndex)];

                if (gsval === '"' || gsval === '`') {
                    gsval += ' ';
                }
                
                row += gsval;
            }
            
            aimg.push(row);
        }
        
        return aimg;
    }
    
    function escapeXML(str) {
        return str.replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&apos;');
    }
    
    function generateYTTContent(entries) {
        let yttContent = `<?xml version="1.0" encoding="utf-8"?>
<timedtext format="3">
<head>
    <pen id="1" b="1" fc="#FFFFFF" fo="254" et="3" ec="#000000" fs="3" sz="50" of="1" i="0" u="0" bc="#000000" bo="254" rb="0" hg="0" />
    <ws id="0" ju="0" pd="0" sd="0" mh="0" />
    <wp id="0" ap="4" ah="50" av="50"/>
</head>
<body>
`;
        
        entries.forEach(entry => {
            const { start, end, text } = entry;
            const escapedText = escapeXML(text);
            yttContent += `    <p t="${msToYTTFormat(start)}" d="${msToYTTFormat(end - start)}" wp="0" ws="0"><s p="1">${escapedText}</s></p>\n`;
        });
        
        yttContent += `</body>
</timedtext>`;
        
        return yttContent;
    }
    
    function startConversion() {
        const file = videoFileInput.files[0];
        const fps = parseInt(fpsInput.value);
        let columns = parseInt(columnsInput.value);
        const msOffset = parseInt(msOffsetInput.value) || 0;
        const idOffset = parseInt(idOffsetInput.value) || 0;
        const format = exportFormat.value;
        
        let charSet;
        if (charSetInput.value === 'custom') {
            charSet = customCharSetInput.value;
            if (!charSet || charSet.length < 2) {
                showAlert('Error', 'El conjunto de caracteres personalizado debe tener al menos 2 caracteres');
                return;
            }
        } else {
            charSet = currentCharSet;
        }
        
        if (!file) {
            showAlert('Error', 'Por favor selecciona un archivo de video');
            return;
        }
        
        if (fps % 30 !== 0) {
            showAlert('Error', 'El FPS debe ser múltiplo de 30 (30, 60, 90...)');
            return;
        }

        if (columns > 40) columns = 40;
        if (columns < 10) columns = 10;
        
        if (charSet.length < 2) {
            showAlert('Error', 'Selecciona un conjunto de caracteres válido');
            return;
        }

        progressContainer.style.display = 'block';
        downloadSection.style.display = 'none';
        progressFill.style.width = '0%';
        progressText.textContent = 'Procesando: 0%';
        statusText.textContent = 'Preparando video...';

        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        video.src = URL.createObjectURL(file);
        video.muted = true;
        video.preload = 'auto';
        
        video.addEventListener('loadedmetadata', function() {
            
            const maxWidth = 800;
            const scale = Math.min(1, maxWidth / video.videoWidth);
            canvas.width = video.videoWidth * scale;
            canvas.height = video.videoHeight * scale;
            
           
            const frameInterval = 1000 / fps;
            const totalFrames = Math.floor(video.duration * fps);
            
            let outputContent = "";
            let frameTime = 0;
            let framesProcessed = 0;
            let currentFrame = 0;
            let yttEntries = [];
 
            function processFrame() {
                if (currentFrame >= totalFrames) {
                
                    statusText.textContent = 'Conversión completada!';
                    
                    if (format === 'ytt') {
                        outputContent = generateYTTContent(yttEntries);
                    }
                    
                    downloadSection.style.display = 'block';
                    fileInfo.textContent = `Archivo generado: ${Math.round(outputContent.length / 1024)} KB`;
                    
                    downloadBtn.dataset.outputContent = outputContent;
                    
                    URL.revokeObjectURL(video.src);
                    return;
                }
                
                const progress = Math.floor((currentFrame / totalFrames) * 100);
                progressFill.style.width = `${progress}%`;
                progressText.textContent = `Procesando: ${progress}%`;
                statusText.textContent = `Procesando frame ${currentFrame + 1} de ${totalFrames}`;
                
                video.currentTime = currentFrame * (1 / fps);
                
                currentFrame++;
                
                video.addEventListener('seeked', function onSeeked() {
                    video.removeEventListener('seeked', onSeeked);
                    
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    
                    try {
                        const asciiArt = convertImageToAscii(imageData, columns, charSet);
                        const asciiText = asciiArt.join('\n');
                        
                        const startTime = frameTime + msOffset;
                        const endTime = startTime + frameInterval;
                        
                        if (format === 'ytt') {
                            yttEntries.push({
                                start: startTime,
                                end: endTime,
                                text: asciiText
                            });
                        } else if (format === 'srt') {
                            outputContent += `${idOffset + framesProcessed + 1}\n`;
                            outputContent += `${msToTimeFormat(startTime)} --> ${msToTimeFormat(endTime)}\n`;
                            outputContent += asciiArt.join('\n') + '\n\n';
                        } else if (format === 'ass') {
                            
                            outputContent += `Dialogue: 0,${msToASSFormat(startTime)},${msToASSFormat(endTime)},Default,,0,0,0,,${asciiArt.join('\\N')}\n`;
                        }
                        
                        frameTime = endTime;
                        framesProcessed++;
                        
                        if (framesProcessed % fps === 0 || framesProcessed === 1) {
                            previewBox.textContent = asciiArt.join('\n');
                        }
                        
                        setTimeout(processFrame, 0);
                    } catch (error) {
                        statusText.textContent = `Error: ${error.message}`;
                        console.error(error);
                    }
                });
            }
            
            video.play().then(() => {
                video.pause();
                processFrame();
            }).catch(error => {
                statusText.textContent = "Error al cargar el video: " + error.message;
            });
        });
        
        video.addEventListener('error', function() {
            statusText.textContent = "Error al cargar el video";
        });
    }
    
    function downloadFile() {
        const outputContent = downloadBtn.dataset.outputContent;
        if (!outputContent) {
            showAlert('Error', 'Primero debes convertir un video');
            return;
        }
        
        const format = exportFormat.value;
        let fileName = 'subtitulos_ascii';
        let mimeType = 'text/plain';
        
        if (format === 'ytt') {
            fileName += '.ytt';
            mimeType = 'application/xml';
        } else if (format === 'srt') {
            fileName += '.srt';
        } else if (format === 'ass') {
            fileName += '.ass';
        }
        
        const blob = new Blob([outputContent], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }
});