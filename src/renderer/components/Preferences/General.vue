<template>
  <div class="general tabcontent">
    <div class="settingItem">
      <div class="settingItem__title">{{ $t("preferences.general.displayLanguage") }}</div>
      <div class="settingItem__description">{{ $t("preferences.general.switchDisplayLanguages")}}</div>
      <div class="settingItem__input dropdown">
        <div class="dropdown__toggle no-drag" :class="showSelection ? 'dropdown__toggle--list' : 'dropdown__toggle--display'"
          @mouseup.stop="showSelection = !showSelection">
          <div class="dropdown__displayItem">{{ mapCode(displayLanguage) }}</div>
          <div class="dropdown__listItems"
            @mouseup.stop="">
            <div class="dropdownListItem"
              v-for="(language, index) in displayLanguages"
              :key="index"
              @mouseup.stop="handleSelection(language)">
              {{ mapCode(language) }}
            </div>
          </div>
          <Icon type="rightArrow" :class="showSelection ? 'dropdown__icon--arrowUp' : 'dropdown__icon--arrowDown'"/>
        </div>
      </div>
    </div>
    <div class="settingItem--justify">
      <div>
        <div class="settingItem__title">{{ $t("preferences.general.setDefault") }}</div>
        <div class="settingItem__description">{{ $t("preferences.general.setDefaultDescription") }}</div>
      </div>
      <div class="settingItem__input button no-drag"
        :class="button1Styles"
        ref="button1"
        @mousedown="mousedownOnSetDefault">
        <transition name="button" mode="out-in">
          <div key="" v-if="!defaultState" class="button__text">{{ $t("preferences.general.setButton") }}</div>
          <div :key="defaultState" v-else class="button__result">
            <Icon :type="defaultState" :class="defaultState"/>
          </div>
        </transition>
      </div>
    </div>
    <div class="settingItem--justify" v-if="false">
      <div>
        <div class="settingItem__title">{{ $t("preferences.general.restoreSettings") }}</div>
        <div class="settingItem__description">{{ $t("preferences.general.restoreSettingsDescription") }}</div>
      </div>
      <div class="settingItem__input button no-drag"
        :class="button2Styles"
        ref="button2"
        @mousedown="mousedownOnRestore">
        <transition name="button" mode="out-in">
          <div :key="needToRelaunch" class="button__text" ref="restoreContent">{{ restoreContent }}</div>
        </transition>
      </div>
    </div>
    <div class="settingItem__title">{{ $t("preferences.general.others") }}</div>
    <BaseCheckBox
      :checkboxValue="reverseScrolling"
      @update:checkbox-value="reverseScrolling = $event">
      {{ $t('preferences.general.reverseScrolling') }}
    </BaseCheckBox>
    <BaseCheckBox
      :checkboxValue="deleteVideoHistoryOnExit"
      @update:checkbox-value="deleteVideoHistoryOnExit = $event">
      {{ $t('preferences.general.clearHistory') }}
    </BaseCheckBox>
  </div>
</template>

<script>
import electron from 'electron';
import { setAsDefaultApp } from '@/../shared/system';
import Icon from '@/components/BaseIconContainer.vue';
import { codeToLanguageName } from '@/helpers/language';
import BaseCheckBox from './BaseCheckBox.vue';

export default {
  name: 'General',
  components: {
    BaseCheckBox,
    Icon,
  },
  props: ['mouseDown', 'isMoved'],
  data() {
    return {
      showSelection: false,
      isSettingDefault: false,
      isRestoring: false,
      defaultState: '',
      restoreState: '',
      defaultButtonTimeoutId: NaN,
      restoreButtonTimeoutId: NaN,
      needToRelaunch: false,
      restoreContent: '',
      languages: ['zhCN', 'zhTW', 'ja', 'ko', 'en', 'es', 'ar'],
      button1Styles: [''],
      button2Styles: [''],
    };
  },
  created() {
    electron.ipcRenderer.once('restore-state', (event, state) => {
      this.restoreContent = state ? this.$t('preferences.general.relaunch')
        : this.$t('preferences.general.setButton');
    });
  },
  watch: {
    displayLanguage(val) {
      if (val) this.$i18n.locale = val;
      electron.ipcRenderer.send('get-restore-state');
      electron.ipcRenderer.once('restore-state', (event, state) => {
        this.restoreContent = state ? this.$t('preferences.general.relaunch')
          : this.$t('preferences.general.setButton');
      });
    },
    mouseDown(val, oldVal) {
      if (!val && oldVal && !this.isMoved) {
        this.showSelection = false;
      } else if (!val && oldVal && this.isMoved) {
        this.$emit('move-stoped');
      }
    },
  },
  computed: {
    isMac() {
      return process.platform === 'darwin';
    },
    preferenceData() {
      return this.$store.getters.preferenceData;
    },
    reverseScrolling: {
      get() {
        return this.$store.getters.reverseScrolling;
      },
      set(val) {
        if (val) {
          this.$store.dispatch('reverseScrolling').then(() => {
            electron.ipcRenderer.send('preference-to-main', this.preferenceData);
          });
        } else {
          this.$store.dispatch('notReverseScrolling').then(() => {
            electron.ipcRenderer.send('preference-to-main', this.preferenceData);
          });
        }
      },
    },
    deleteVideoHistoryOnExit: {
      get() {
        return this.$store.getters.deleteVideoHistoryOnExit;
      },
      set(val) {
        if (val) {
          this.$store.dispatch('deleteVideoHistoryOnExit').then(() => {
            electron.ipcRenderer.send('preference-to-main', this.preferenceData);
          });
        } else {
          this.$store.dispatch('notDeleteVideoHistoryOnExit').then(() => {
            electron.ipcRenderer.send('preference-to-main', this.preferenceData);
          });
        }
      },
    },
    displayLanguage: {
      get() {
        return this.$store.getters.displayLanguage;
      },
      set(val) {
        this.$store.dispatch('displayLanguage', val).then(() => {
          electron.ipcRenderer.send('preference-to-main', this.preferenceData);
        });
      },
    },
    displayLanguages() {
      return this.languages.filter(language => language !== this.displayLanguage);
    },
  },
  methods: {
    mouseupOnOther() {
      if (!this.isSettingDefault) {
        this.button1Styles.pop();
      }
      if (!this.isRestoring) {
        this.button2Styles.pop();
      }
      document.removeEventListener('mouseup', this.mouseupOnOther);
      this.$refs.button1.removeEventListener('mouseup', this.setDefault);
      this.$refs.button2.removeEventListener('mouseup', this.restoreSettings);
    },
    mousedownOnSetDefault() {
      if (!this.isSettingDefault) {
        this.button1Styles.push('button--mouseDown');
        this.$refs.button1.addEventListener('mouseup', this.setDefault);
        document.addEventListener('mouseup', this.mouseupOnOther);
      }
    },
    mousedownOnRestore() {
      if (!this.isSettingDefault) {
        this.button2Styles.push('button--mouseDown');
        this.$refs.button2.addEventListener('mouseup', this.restoreSettings);
        document.addEventListener('mouseup', this.mouseupOnOther);
      }
    },
    async setDefault() {
      if (this.isSettingDefault) return;
      this.isSettingDefault = true;
      try {
        await setAsDefaultApp();
        // TODO: feedback
        clearTimeout(this.defaultButtonTimeoutId);
        this.defaultState = 'success';
        this.button1Styles.pop();
        this.defaultButtonTimeoutId = setTimeout(() => {
          this.defaultState = '';
          this.isSettingDefault = false;
          this.$refs.button1.style.setProperty('transition-delay', '');
        }, 1500);
      } catch (ex) {
        // TODO: feedback
        clearTimeout(this.defaultButtonTimeoutId);
        this.defaultState = 'failed';
        this.button2Styles.pop();
        this.defaultButtonTimeoutId = setTimeout(() => {
          this.defaultState = '';
          this.isSettingDefault = false;
          this.$refs.button1.style.setProperty('transition-delay', '');
        }, 1500);
      } finally {
        this.$refs.button1.removeEventListener('mouseup', this.setDefault);
      }
    },
    restoreSettings() {
      this.isRestoring = true;
      if (this.restoreContent === this.$t('preferences.general.setButton')) {
        electron.ipcRenderer.send('apply');
        this.needToRelaunch = true;
        this.restoreContent = this.$t('preferences.general.relaunch');
        this.button2Styles.pop();
        this.isRestoring = false;
        return;
      }
      electron.ipcRenderer.send('relaunch');
      this.isRestoring = false;
      this.$refs.button2.removeEventListener('mouseup', this.restoreSettings);
    },
    mapCode(code) {
      return codeToLanguageName(code);
    },
    handleSelection(language) {
      this.displayLanguage = language;
      this.showSelection = false;
    },
  },
};
</script>
<style scoped lang="scss">
.tabcontent {
  .settingItem {
    margin-bottom: 30px;

    &__title {
      font-family: $font-medium;
      font-size: 13px;
      color: rgba(255,255,255,0.9);
    }

    &__description {
      font-family: $font-medium;
      font-size: 11px;
      color: rgba(255,255,255,0.5);
      margin-top: 7px;
    }

    &__input {
      -webkit-app-region: no-drag;
      cursor: pointer;
      font-family: $font-semibold;
      font-size: 11px;
      color: #FFFFFF;
      text-align: center;
      border-radius: 2px;
      border: 1px solid rgba(255,255,255,0.1);
      background-color: rgba(255,255,255,0.03);
      transition: all 200ms;

      &:hover {
        border: 1px solid rgba(255,255,255,0.2);
        background-color: rgba(255,255,255,0.08);
      }
    }

    &--justify {
      @extend .settingItem;
      display: flex;
      justify-content: space-between;
    }
  }
  .dropdown {
    position: relative;
    width: 240px;
    height: 28px;
    margin-top: 13px;
    
    &__toggle {
      position: absolute;
      width: 100%;
      margin-top: -1px;
      margin-left: -1px;
      transition: all 200ms;
      border-radius: 2px;
      overflow: hidden;
      

      &--display {
        height: 28px;
        border: 1px solid rgba(255,255,255,0);
        background-color: rgba(255, 255, 255, 0);
      }
      
      &--list { 
        height: 148px;
        border: 1px solid rgba(255,255,255,0.3);
        background-color: rgba(120,120,120,1);
        .dropdown__displayItem {
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
      }
    }

    &__displayItem {
      height: 28px;
      line-height: 28px;
      border-bottom: 1px solid rgba(255,255,255,0);
    }

    &__listItems {
      cursor: pointer;
      position: relative;
      height: 112px;
      margin: 4px 4px 4px 6px;
      overflow-y: scroll;
    }

    .dropdownListItem {
      height: 28px;
      line-height: 28px;

      &:hover {
        background-image: linear-gradient(90deg, rgba(255,255,255,0.00) 0%, rgba(255,255,255,0.069) 23%, rgba(255,255,255,0.00) 100%);
      }
    }

    &__icon {
      position: absolute;
      top: 7px;
      right: 8px;
      transition: transform 200ms;
      &--arrowDown {
        @extend .dropdown__icon;
        transform: rotate(90deg);
      }
      &--arrowUp {
        @extend .dropdown__icon;
        z-index: 100;
        transform: rotate(-90deg);
      }
    }

    ::-webkit-scrollbar {
      width: 3px;
      user-select: none;
    }
    /* Handle */
    ::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 1.5px;
    }
    ::-webkit-scrollbar-track {
      border-radius: 2px;
      width: 10px;
      user-select: none;
    }
  }
  .button {
    box-sizing: border-box;
    align-self: center;
    width: 61px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;

    .button-enter, .button-leave-to {
      opacity: 0;
    }
    .button-enter-active {
      transition: opacity 200ms ease-in;
    }
    .button-leave-active {
      transition: opacity 200ms ease-in;
    }

    &__text {
      font-family: $font-medium;
      font-size: 11px;
      color: #FFFFFF;
      letter-spacing: 0;
      text-align: center;
      line-height: 26px;
    }
    &__result {
      width: 15px;
      height: 15px;
    }
    &--mouseDown {
      opacity: 0.5;
    }
  }
}
</style>
