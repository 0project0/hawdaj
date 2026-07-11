/* ============================================
   HAWDAJ GAME — Intro & Sequence Dialogue System
   ============================================ */

const HawdajDialogue = (() => {
    let container = null;
    let jadelImgEl = null;
    let azzamImgEl = null;
    let textEl = null;
    let nextBtn = null;
    let tail = null;
    let audioObj = null;
    let onCompleteCallback = null;

    let currentStepIndex = 0;
    let activeSequence = null;

    function init() {
        if (document.getElementById('dialogue-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'dialogue-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.6); z-index: 10000;
            display: none; align-items: center; justify-content: center;
            transition: opacity 0.3s;
        `;

        const wrapper = document.createElement('div');
        wrapper.style.cssText = `
            position: relative; width: 90%; max-width: 800px;
            display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
            height: auto; max-height: 75vh; pointer-events: none;
        `;
        overlay.appendChild(wrapper);

        // Speech Bubble (Cloud style)
        const bubble = document.createElement('div');
        bubble.style.cssText = `
            background: #fff; border: 4px solid var(--accent-primary); border-radius: 40px;
            padding: clamp(14px, 3vw, 30px); box-shadow: 0 10px 30px rgba(0,0,0,0.4); margin-bottom: 20px;
            position: relative; text-align: center; width: clamp(260px, 75%, 500px); pointer-events: auto;
            transform: scale(0.8); opacity: 0; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        `;

        // Bubble tail (pointing to Jadel on the left side in RTL)
        tail = document.createElement('div');
        tail.style.cssText = `
            content: ''; position: absolute; bottom: -24px; left: 25%; right: auto;
            border-width: 25px 25px 0; border-style: solid;
            border-color: #fff transparent transparent transparent;
            display: block; width: 0; filter: drop-shadow(0px 5px 0px var(--accent-primary));
            transition: left 0.3s ease;
        `;
        bubble.appendChild(tail);

        textEl = document.createElement('p');
        textEl.style.cssText = 'color: #1a202c; font-size: clamp(0.85rem, 2.5vw, 1.15rem); font-weight: 800; line-height: 1.5; margin:0;';
        bubble.appendChild(textEl);

        nextBtn = document.createElement('button');
        nextBtn.textContent = 'يلا نبدأ! ▶';
        nextBtn.className = 'btn btn-primary';
        nextBtn.style.cssText = 'margin-top: 20px; font-size: var(--fs-md); padding: 10px 30px;';
        bubble.appendChild(nextBtn);

        wrapper.appendChild(bubble);

        // Characters container
        const charsContainer = document.createElement('div');
        charsContainer.style.cssText = `
            display: flex; justify-content: space-around; width: 100%; align-items: flex-end;
            transform: translateY(100%); transition: transform 0.5s ease-out;
        `;

        azzamImgEl = document.createElement('img');
        azzamImgEl.style.cssText = `width: clamp(120px, 35vw, 250px); max-width: 250px; object-fit: contain; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.5)); transition: all 0.3s ease;`;

        jadelImgEl = document.createElement('img');
        jadelImgEl.style.cssText = `width: clamp(130px, 38vw, 280px); max-width: 280px; object-fit: contain; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.5)); transition: all 0.3s ease;`;

        charsContainer.appendChild(azzamImgEl);
        charsContainer.appendChild(jadelImgEl);

        wrapper.appendChild(charsContainer);
        document.body.appendChild(overlay);
        container = overlay;
    }

    /**
     * Show a sequence of dialogue steps
     * @param {Array} sequence Array of objects: { character, pose, text, audio }
     * @param {Function} onComplete Callback when sequence completes
     */
    function play(sequence, onComplete = null) {
        if (!container) init();
        onCompleteCallback = onComplete;
        activeSequence = sequence;
        currentStepIndex = 0;

        container.style.display = 'flex';
        // forced reflow
        container.offsetHeight;
        container.style.opacity = '1';

        const wrapper = container.children[0];
        const bubble = wrapper.children[0];
        const charsContainer = wrapper.children[1];

        charsContainer.style.transform = 'translateY(0)';
        setTimeout(() => {
            bubble.style.transform = 'scale(1)';
            bubble.style.opacity = '1';
            showStep(0);
        }, 300);
    }

    function showStep(index) {
        if (!activeSequence || index >= activeSequence.length) {
            close();
            return;
        }

        const step = activeSequence[index];
        const char = step.character;

        // Stop current audio
        if (audioObj) {
            audioObj.pause();
            audioObj = null;
        }

        // Set Images based on current pose
        jadelImgEl.src = HawdajData.getCharacterPose('jadel', char === 'jadel' ? step.pose : 'idle') || 'assets/char/El jadel.jpeg';
        azzamImgEl.src = HawdajData.getCharacterPose('azzam', char === 'azzam' ? step.pose : 'idle') || 'assets/char/azzam.jpeg';

        // Highlight active speaker
        if (char === 'jadel') {
            jadelImgEl.style.opacity = '1';
            jadelImgEl.style.transform = 'scale(1.05)';
            azzamImgEl.style.opacity = '0.6';
            azzamImgEl.style.transform = 'scale(0.95)';
            if (tail) tail.style.left = '25%';
        } else {
            azzamImgEl.style.opacity = '1';
            azzamImgEl.style.transform = 'scale(1.05)';
            jadelImgEl.style.opacity = '0.6';
            jadelImgEl.style.transform = 'scale(0.95)';
            if (tail) tail.style.left = '75%';
        }

        // Type the text
        typeText(step.text);

        // Update button text
        if (index === activeSequence.length - 1) {
            nextBtn.textContent = 'يلا نبدأ! ▶';
        } else {
            nextBtn.textContent = 'التالي ➡️';
        }

        // Play audio if available
        if (step.audio) {
            audioObj = new Audio(step.audio);
            audioObj.play().catch(e => console.warn('Dialogue audio failed', e));
        }

        // Setup button click
        nextBtn.onclick = () => {
            HawdajAudio.SFX.tap();
            currentStepIndex++;
            if (currentStepIndex >= activeSequence.length) {
                close();
                if (onCompleteCallback) onCompleteCallback();
            } else {
                showStep(currentStepIndex);
            }
        };
    }

    /**
     * Show game intro dialogue (backward compatibility)
     * @param {string} text The text Jadel will say
     * @param {string} audioPath The audio file path
     * @param {Function} onComplete Callback when user clicks "Start"
     */
    function showIntro(text, audioPath, onComplete = null) {
        play([{ character: 'jadel', pose: 'talking', text: text, audio: audioPath }], onComplete);
    }

    function typeText(text) {
        textEl.textContent = '';
        let i = 0;
        nextBtn.style.display = 'none';

        const typeInterval = setInterval(() => {
            textEl.textContent += text.charAt(i);
            i++;
            if (i >= text.length) {
                clearInterval(typeInterval);
                nextBtn.style.display = 'inline-block';
            }
        }, 40);
    }

    function close() {
        if (!container) return;
        if (audioObj) {
            audioObj.pause();
            audioObj = null;
        }

        const wrapper = container.children[0];
        const bubble = wrapper.children[0];
        const charsContainer = wrapper.children[1];

        bubble.style.transform = 'scale(0.8)';
        bubble.style.opacity = '0';
        charsContainer.style.transform = 'translateY(100%)';
        container.style.opacity = '0';

        setTimeout(() => {
            container.style.display = 'none';
            if (onCompleteCallback) onCompleteCallback();
        }, 400);
    }

    return {
        init,
        play,
        showIntro,
        close
    };
})();

window.addEventListener('load', () => HawdajDialogue.init());
