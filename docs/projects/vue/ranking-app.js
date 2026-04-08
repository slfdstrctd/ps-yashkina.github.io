import { createApp, nextTick, onMounted, ref } from "https://unpkg.com/vue@3/dist/vue.esm-browser.prod.js";
import Sortable from "https://esm.sh/sortablejs@1.15.2";
import { STORAGE_KEYS, capitalizeFirstLetter, normalizeStoredItems } from "./shared.js";

createApp({
  setup() {
    const items = ref(
      normalizeStoredItems(JSON.parse(localStorage.getItem(STORAGE_KEYS.SELECTED_FOR_RANKING) || "[]")),
    );
    const infoId = ref(null);
    const rankingListRef = ref(null);
    let sortable = null;

    function persist() {
      localStorage.setItem(STORAGE_KEYS.SELECTED_FOR_RANKING, JSON.stringify(items.value));
    }

    onMounted(async () => {
      await nextTick();
      if (!rankingListRef.value) return;
      sortable = Sortable.create(rankingListRef.value, {
        animation: 170,
        easing: "cubic-bezier(0.2, 0, 0, 1)",
        ghostClass: "ranking-ghost",
        chosenClass: "ranking-chosen",
        dragClass: "ranking-drag",
        forceFallback: false,
        filter: ".value-info-btn",
        preventOnFilter: false,
        onStart: () => {
          infoId.value = null;
        },
        onEnd: (evt) => {
          infoId.value = null;
          const { oldIndex, newIndex } = evt;
          if (oldIndex == null || newIndex == null || oldIndex === newIndex) return;
          const next = items.value.slice();
          const [moved] = next.splice(oldIndex, 1);
          next.splice(newIndex, 0, moved);
          items.value = next;
          persist();
        },
      });
    });

    return {
      capitalizeFirstLetter,
      infoId,
      items,
      rankingListRef,
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
      <ol v-else ref="rankingListRef" class="ranking-list ranking-list-vue">
        <li
          v-for="(item, i) in items"
          :key="item.id"
          class="ranking-row"
        >
          <article class="rank-item" :class="{ 'value-card--info-visible': infoId === item.id }">
            <div class="rank-item-text">
              <strong class="rank-index">{{ i + 1 }}.</strong>
              <span class="value-name">{{ capitalizeFirstLetter(item.name) }}</span>
            </div>
            <div class="rank-controls">
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

