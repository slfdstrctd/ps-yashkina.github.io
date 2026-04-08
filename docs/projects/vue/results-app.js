import { createApp, computed, onMounted, ref, watch } from "https://unpkg.com/vue@3/dist/vue.esm-browser.prod.js";
import { PDFDocument, rgb } from "https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/+esm";
import { STORAGE_KEYS, THEME_PRESETS, capitalizeFirstLetter, normalizeHex } from "./shared.js";

const TELEGRAM_FOOTER_TEXT = "Мой телеграм-канал: t.me/banalinsight";

createApp({
  setup() {
    const values = ref([]);
    const background = ref("#ffffff");
    const text = ref("#000000");
    const previewSrc = ref("");
    const isBusy = ref(false);

    const hasData = computed(() => values.value.length > 0);

    function mixHex(a, b, t) {
      const A = normalizeHex(a, "#ffffff").slice(1);
      const B = normalizeHex(b, "#000000").slice(1);
      const av = [0, 2, 4].map((n) => parseInt(A.slice(n, n + 2), 16));
      const bv = [0, 2, 4].map((n) => parseInt(B.slice(n, n + 2), 16));
      const out = av.map((v, i) => Math.round(v + (bv[i] - v) * t));
      return `#${out.map((n) => n.toString(16).padStart(2, "0")).join("")}`;
    }

    function buildCanvas() {
      const canvas = document.createElement("canvas");
      canvas.width = 1600;
      canvas.height = 2260;
      const ctx = canvas.getContext("2d");
      const bg = normalizeHex(background.value, "#ffffff");
      const tx = normalizeHex(text.value, "#000000");
      const txSoft = mixHex(tx, bg, 0.3);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = tx;
      ctx.textAlign = "center";
      ctx.font = "700 62px -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";
      ctx.fillText("Мои основные ценности", canvas.width / 2, 140);

      let y = 280;
      ctx.textAlign = "left";
      values.value.forEach((v, index) => {
        ctx.fillStyle = tx;
        ctx.font = "700 42px -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";
        ctx.fillText(`${index + 1}. ${capitalizeFirstLetter(v.name || "")}`, 130, y);
        y += 56;
        ctx.fillStyle = txSoft;
        ctx.font = "400 30px -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";
        ctx.fillText(capitalizeFirstLetter(v.description || ""), 176, y);
        y += 96;
      });

      ctx.fillStyle = txSoft;
      ctx.font = "400 26px -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";
      ctx.fillText(TELEGRAM_FOOTER_TEXT, 130, canvas.height - 120);
      return canvas;
    }

    async function refreshPreview() {
      if (!hasData.value) return;
      isBusy.value = true;
      const canvas = buildCanvas();
      previewSrc.value = canvas.toDataURL("image/png");
      isBusy.value = false;
    }

    async function savePng() {
      const canvas = buildCanvas();
      const a = document.createElement("a");
      a.download = "values-results.png";
      a.href = canvas.toDataURL("image/png");
      a.click();
    }

    async function savePdf() {
      const canvas = buildCanvas();
      const bytes = await new Promise((resolve, reject) => {
        canvas.toBlob(async (blob) => {
          if (!blob) return reject(new Error("PDF build failed"));
          resolve(new Uint8Array(await blob.arrayBuffer()));
        }, "image/png");
      });
      const doc = await PDFDocument.create();
      const page = doc.addPage([595.28, 841.89]);
      const image = await doc.embedPng(bytes);
      page.drawRectangle({
        x: 0,
        y: 0,
        width: 595.28,
        height: 841.89,
        color: rgb(1, 1, 1),
      });
      page.drawImage(image, { x: 0, y: 0, width: 595.28, height: 841.89 });
      const out = await doc.save();
      const blob = new Blob([out], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "values-results.pdf";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    }

    function swapColors() {
      const a = background.value;
      background.value = text.value;
      text.value = a;
    }

    onMounted(() => {
      values.value = (JSON.parse(localStorage.getItem(STORAGE_KEYS.SELECTED_FOR_RANKING) || "[]") || []).map(
        (item) => (typeof item === "string" ? { name: item, description: "" } : item),
      );
      refreshPreview();
    });

    watch([background, text], refreshPreview);

    return {
      THEME_PRESETS,
      background,
      hasData,
      isBusy,
      previewSrc,
      savePdf,
      savePng,
      swapColors,
      text,
    };
  },
  template: `
    <div>
      <h1>Сохранить результат</h1>
      <p class="description">Выберите цвет фона и текста. Затем сохраните результат в PNG или PDF.</p>

      <div class="values-final-layout">
        <div class="values-final-controls">
          <section class="style-group">
            <h2>Фон и текст</h2>
            <div class="color-preset-wrap">
              <button
                v-for="preset in THEME_PRESETS"
                :key="preset.id"
                type="button"
                class="color-preset-btn color-theme-btn"
                :title="preset.label"
                :style="{ backgroundImage: 'linear-gradient(90deg, ' + preset.background + ' 50%, ' + preset.text + ' 50%)' }"
                @click="background = preset.background; text = preset.text"
              />
              <button class="color-theme-swap" type="button" @click="swapColors">⇄</button>
            </div>
          </section>
        </div>
        <div class="values-final-preview-wrap">
          <div class="values-preview-heading-row">
            <h2 class="values-preview-heading">Предпросмотр</h2>
            <span v-if="isBusy" class="preview-heading-spinner" role="status">Загрузка…</span>
          </div>
          <div class="final-preview-image">
            <img v-if="hasData && previewSrc" class="final-preview-png" :src="previewSrc" alt="Предпросмотр списка ценностей">
            <p v-else class="description">Нет данных для предпросмотра.</p>
          </div>
        </div>
      </div>

      <div class="project-buttons">
        <a class="button secondary" href="values-ranking.html">Вернуться к ранжированию</a>
        <button class="button" type="button" :disabled="!hasData" @click="savePng">Сохранить PNG</button>
        <button class="button" type="button" :disabled="!hasData" @click="savePdf">Сохранить PDF</button>
      </div>
    </div>
  `,
}).mount("#values-results-app");

