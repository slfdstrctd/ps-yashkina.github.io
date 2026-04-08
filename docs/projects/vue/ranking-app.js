import { createApp, ref } from "https://unpkg.com/vue@3/dist/vue.esm-browser.prod.js";
import { STORAGE_KEYS, capitalizeFirstLetter, normalizeStoredItems } from "./shared.js";

createApp({
  setup() {
    const items = ref(
      normalizeStoredItems(JSON.parse(localStorage.getItem(STORAGE_KEYS.SELECTED_FOR_RANKING) || "[]")),
    );
    const infoId = ref(null);
    const draggingIndex = ref(null);

    function persist() {
      localStorage.setItem(STORAGE_KEYS.SELECTED_FOR_RANKING, JSON.stringify(items.value));
    }

    function move(index, dir) {
      const to = index + dir;
      if (to < 0 || to >= items.value.length) return;
      const next = items.value.slice();
      const [x] = next.splice(index, 1);
      next.splice(to, 0, x);
      items.value = next;
      infoId.value = null;
      persist();
    }

    function onDragStart(event, index) {
      draggingIndex.value = index;
      infoId.value = null;
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", String(index));
      }
    }

    function onDragOver(event) {
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "move";
      }
    }

    function onDrop(event, toIndex) {
      event.preventDefault();
      const fromIndex = draggingIndex.value;
      draggingIndex.value = null;
      infoId.value = null;
      if (fromIndex === null || fromIndex === toIndex) return;
      if (fromIndex < 0 || fromIndex >= items.value.length) return;
      const next = items.value.slice();
      const [x] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, x);
      items.value = next;
      persist();
    }

    function onDragEnd() {
      draggingIndex.value = null;
      infoId.value = null;
    }

    return {
      capitalizeFirstLetter,
      draggingIndex,
      infoId,
      items,
      move,
      onDragEnd,
      onDragOver,
      onDragStart,
      onDrop,
    };
  },
  template: `
    <div>
      <h1>Ранжирование ценностей</h1>
      <p class="description">
        Расставьте ценности по важности. На мобильных устройствах используйте кнопки вверх/вниз.
      </p>
      <ul class="ranking-reflection-bullets">
        <li>Насколько осмысленной будет жизнь, если этого качества не станет?</li>
        <li>Какой дискомфорт я готов перенести, чтобы быть таким человеком?</li>
      </ul>

      <div v-if="items.length === 0" class="description">Сначала выберите ценности в предыдущем шаге.</div>
      <ol v-else class="ranking-list ranking-list-vue">
        <li
          v-for="(item, i) in items"
          :key="item.id"
          class="ranking-row"
          draggable="true"
          @dragstart="onDragStart($event, i)"
          @dragover="onDragOver"
          @drop="onDrop($event, i)"
          @dragend="onDragEnd"
        >
          <article class="rank-item" :class="{ 'value-card--info-visible': infoId === item.id, 'rank-item--dragging': draggingIndex === i }">
            <div class="rank-item-text">
              <strong class="rank-index">{{ i + 1 }}.</strong>
              <span class="value-name">{{ capitalizeFirstLetter(item.name) }}</span>
            </div>
            <div class="rank-controls">
              <button class="button secondary rank-move-btn" type="button" :disabled="i===0" @click="move(i, -1)">↑</button>
              <button class="button secondary rank-move-btn" type="button" :disabled="i===items.length-1" @click="move(i, 1)">↓</button>
              <button class="value-info-btn" type="button" @click="infoId = infoId === item.id ? null : item.id">i</button>
            </div>
            <p class="value-description">{{ capitalizeFirstLetter(item.description) }}</p>
          </article>
        </li>
      </ol>

      <div class="project-buttons">
        <a class="button secondary" href="values-check-list.html">Вернуться к определению ценностей</a>
        <a class="button" href="values-save-results.html">Сохранить результаты</a>
      </div>
    </div>
  `,
}).mount("#values-ranking-app");

