import { createApp, computed, onMounted, onUnmounted, ref } from "https://unpkg.com/vue@3/dist/vue.esm-browser.prod.js";
import { LIMITS, STORAGE_KEYS, capitalizeFirstLetter } from "./shared.js";

createApp({
  setup() {
    const values = ref([]);
    const checkedState = ref([]);
    const currentPage = ref(0);
    const hasReachedLastPage = ref(false);
    const activeInfoId = ref(null);
    const showSelectionWarning = ref(false);
    let closeInfoOnOutsideClick = null;

    const totalPages = computed(() =>
      Math.max(1, Math.ceil(values.value.length / LIMITS.ITEMS_PER_PAGE)),
    );
    const checkedCount = computed(() => checkedState.value.filter(Boolean).length);
    const pageItems = computed(() => {
      const start = currentPage.value * LIMITS.ITEMS_PER_PAGE;
      return values.value.slice(start, start + LIMITS.ITEMS_PER_PAGE).map((item, idx) => ({
        ...item,
        sourceIndex: start + idx,
      }));
    });

    function persist() {
      localStorage.setItem(STORAGE_KEYS.CHECKLIST, JSON.stringify(checkedState.value));
      localStorage.setItem(STORAGE_KEYS.RANKING_UNLOCKED, JSON.stringify(hasReachedLastPage.value));
    }

    function getCheckedValues() {
      return values.value
        .map((item, index) => ({ item, index }))
        .filter(({ index }) => checkedState.value[index])
        .map(({ item, index }) => ({
          id: `value-${index}`,
          name: item.name,
          description: item.description,
        }));
    }

    function toggleItem(index) {
      if (!checkedState.value[index] && checkedCount.value >= LIMITS.MAX_CHECKED) return;
      checkedState.value[index] = !checkedState.value[index];
      persist();
    }

    function onCardClick(index, event) {
      if (event?.target?.closest?.(".value-info-btn")) return;
      activeInfoId.value = null;
      toggleItem(index);
    }

    function onCheckboxChange(index, event) {
      activeInfoId.value = null;
      const nextChecked = Boolean(event?.target?.checked);
      if (nextChecked && !checkedState.value[index] && checkedCount.value >= LIMITS.MAX_CHECKED) {
        event.target.checked = false;
        return;
      }
      checkedState.value[index] = nextChecked;
      persist();
    }

    function goPage(delta) {
      activeInfoId.value = null;
      const next = Math.min(totalPages.value - 1, Math.max(0, currentPage.value + delta));
      currentPage.value = next;
      if (next === totalPages.value - 1) hasReachedLastPage.value = true;
      persist();
    }

    function clearAll() {
      checkedState.value = new Array(values.value.length).fill(false);
      currentPage.value = 0;
      hasReachedLastPage.value = false;
      activeInfoId.value = null;
      localStorage.removeItem(STORAGE_KEYS.CHECKLIST);
      localStorage.removeItem(STORAGE_KEYS.SELECTED_FOR_RANKING);
      localStorage.removeItem(STORAGE_KEYS.RANKING_UNLOCKED);
    }

    function proceedToRanking() {
      const selected = getCheckedValues();
      if (selected.length < LIMITS.MIN_FOR_RANKING) {
        showSelectionWarning.value = true;
        return;
      }
      localStorage.setItem(STORAGE_KEYS.SELECTED_FOR_RANKING, JSON.stringify(selected));
      window.location.href = "values-ranking.html";
    }

    onMounted(async () => {
      const response = await fetch("../data/values.json");
      values.value = await response.json();
      hasReachedLastPage.value = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.RANKING_UNLOCKED) || "false",
      );
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHECKLIST) || "null");
      checkedState.value =
        Array.isArray(stored) && stored.length === values.value.length
          ? stored.map(Boolean)
          : new Array(values.value.length).fill(false);

      closeInfoOnOutsideClick = (event) => {
        if (!activeInfoId.value && activeInfoId.value !== 0) return;
        const target = event?.target;
        if (!target?.closest?.(".value-card")) {
          activeInfoId.value = null;
        }
      };
      document.addEventListener("pointerdown", closeInfoOnOutsideClick, true);
    });

    onUnmounted(() => {
      if (closeInfoOnOutsideClick) {
        document.removeEventListener("pointerdown", closeInfoOnOutsideClick, true);
      }
    });

    return {
      LIMITS,
      activeInfoId,
      capitalizeFirstLetter,
      checkedCount,
      checkedState,
      clearAll,
      currentPage,
      goPage,
      hasReachedLastPage,
      pageItems,
      proceedToRanking,
      showSelectionWarning,
      onCardClick,
      onCheckboxChange,
      toggleItem,
      totalPages,
    };
  },
  template: `
    <div>
      <div class="project-top-row">
        <div class="project-top-text">
          <h1>Выбор ценностей</h1>
          <p class="description">Выделите от 5 до 12 слов, отражающих то, каким человеком вы хотите быть.</p>
        </div>
        <div class="selection-counter-wrap" aria-live="polite">
          <div class="selection-counter" :class="{ 'selection-counter-max': checkedCount >= LIMITS.MAX_CHECKED }">{{ checkedCount }}/{{ LIMITS.MAX_CHECKED }}</div>
        </div>
      </div>

      <div class="values-pager" aria-label="Values pages navigation">
        <button class="nav-arrow" type="button" :disabled="currentPage === 0" @click="goPage(-1)">←</button>
        <span class="page-indicator">{{ currentPage + 1 }} / {{ totalPages }}</span>
        <button class="nav-arrow" type="button" :disabled="currentPage >= totalPages - 1" @click="goPage(1)">→</button>
      </div>

      <div class="values-grid" aria-live="polite">
        <article
          v-for="item in pageItems"
          :key="item.sourceIndex"
          class="value-card"
          :class="{
            'value-card--info-visible': activeInfoId === item.sourceIndex,
            'value-card-locked': checkedCount >= LIMITS.MAX_CHECKED && !checkedState[item.sourceIndex]
          }"
          @click="onCardClick(item.sourceIndex, $event)"
        >
          <div class="value-main">
            <div class="value-main-left">
              <input
                type="checkbox"
                :checked="checkedState[item.sourceIndex]"
                :disabled="checkedCount >= LIMITS.MAX_CHECKED && !checkedState[item.sourceIndex]"
                @click.stop
                @change="onCheckboxChange(item.sourceIndex, $event)"
              >
              <span class="value-name">{{ capitalizeFirstLetter(item.name) }}</span>
            </div>
            <button type="button" class="value-info-btn" @click.stop="activeInfoId = activeInfoId === item.sourceIndex ? null : item.sourceIndex">i</button>
          </div>
          <p class="value-description">{{ capitalizeFirstLetter(item.description) }}</p>
        </article>
      </div>

      <div class="checklist-actions">
        <button class="button secondary" type="button" @click="clearAll">Очистить все</button>
        <div class="center-action">
          <button class="button" type="button" @click="proceedToRanking">Перейти к ранжированию</button>
        </div>
      </div>

      <div class="modal-overlay" :hidden="!showSelectionWarning">
        <div class="modal-card modal-card-small" role="dialog" aria-modal="true">
          <h2>Недостаточно ценностей для ранжирования</h2>
          <p class="description">Для перехода к ранжированию необходимо выбрать не менее 5 ценностей.</p>
          <div class="modal-actions">
            <button class="button" type="button" @click="showSelectionWarning = false">OK</button>
          </div>
        </div>
      </div>
    </div>
  `,
}).mount("#values-checklist-app");

