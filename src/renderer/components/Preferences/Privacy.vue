<template>
  <div class="privicy tabcontent">
    <div class="settingItem">
      <BaseCheckBox
        :checkboxValue="privacyAgreement"
        @update:checkbox-value="privacyAgreement = $event">
        {{ $t('preferences.privacy.privacyConfirm') }}
      </BaseCheckBox>
      <div class="settingItem__attached" :style="{opacity: privacyAgreement ? 1 : 0.3}">
        <div class="settingItem__title">{{ $t('preferences.privacy.languagePriority')}}</div>
        <div class="settingItem__description">{{ $t('preferences.privacy.languageDescription')}}</div>
        <table>
          <tr>
            <td class="dropdown__title">{{ $t('preferences.privacy.primary')}}</td>
            <td>
              <div class="settingItem__input dropdown">
                <div :class="showFirstSelection ? 'dropdown__toggle--list' : 'dropdown__toggle--display'"
                  :style="{ cursor: privacyAgreement ? 'pointer' : 'default' }"
                  @mouseup.stop="openFirstDropdown">
                  <div class="dropdown__displayItem">{{ codeToLanguageName(primaryLanguage) }}</div>
                  <div class="dropdown__listItems"
                    @mouseup.stop="">
                    <div class="dropdownListItem"
                      v-for="(language, index) in primaryLanguages"
                      :key="index"
                      @mouseup.stop="handleFirstSelection(language)">
                      {{ codeToLanguageName(language) }}
                    </div>
                  </div>
                  <Icon type="rightArrow" :class="showFirstSelection ? 'dropdown__icon--arrowUp' : 'dropdown__icon--arrowDown'"/>
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <td class="dropdown__title">{{ $t('preferences.privacy.secondary')}}</td>
            <td>
              <div class="settingItem__input dropdown">
                <div :class="showSecondSelection ? 'dropdown__toggle--list' : 'dropdown__toggle--display'"
                  :style="{ cursor: privacyAgreement ? 'pointer' : 'default' }"
                  @mouseup.stop="openSecondDropdown">
                  <div class="dropdown__displayItem">{{ codeToLanguageName(secondaryLanguage) }}</div>
                  <div class="dropdown__listItems"
                    @mouseup.stop="">
                    <div class="dropdownListItem" ref="secondarySelection"
                      v-for="(language, index) in secondaryLanguages"
                      :key="index"
                      :style="{
                        color: (language === primaryLanguage && language !== noLanguage) ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,1)',
                      }"
                      @mouseup.stop="handleSecondSelection(language, index)">
                      {{ codeToLanguageName(language) }}
                      <span v-if="language === primaryLanguage && language !== noLanguage"
                        style="color: rgba(255,255,255,0.5)">- {{ $t('preferences.privacy.primary') }}</span>
                    </div>
                  </div>
                  <Icon type="rightArrow" :class="showSecondSelection ? 'dropdown__icon--arrowUp' : 'dropdown__icon--arrowDown'"/>
                </div>
              </div>
            </td>
          </tr>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import electron from 'electron';
import { codeToLanguageName } from '@/helpers/language';
import Icon from '@/components/BaseIconContainer.vue';
import BaseCheckBox from './BaseCheckBox.vue';

export default {
  name: 'General',
  components: {
    Icon,
    BaseCheckBox,
  },
  props: ['mouseDown', 'isMoved'],
  data() {
    return {
      showFirstSelection: false,
      showSecondSelection: false,
      languages: [
        '',
        'zh-CN',
        'zh-TW',
        'ja',
        'ko',
        'en',
        'es',
        'fr',
        'de',
        'it',
        'pt',
        'cs',
        'ru',
        'id',
        'ar',
        'hi',
      ],
      noLanguage: this.$t('preferences.privacy.none'),
    };
  },
  watch: {
    privacyAgreement(val) {
      if (!val) {
        this.showFirstSelection = this.showSecondSelection = false;
      }
    },
    mouseDown(val, oldVal) {
      if (!val && oldVal && !this.isMoved) {
        this.showFirstSelection = this.showSecondSelection = false;
      } else if (!val && oldVal && this.isMoved) {
        this.$emit('move-stoped');
      }
    },
  },
  computed: {
    primaryLanguages() {
      return this.languages.filter(language => language && language !== this.primaryLanguage);
    },
    secondaryLanguages() {
      return this.languages.filter(language => language !== this.secondaryLanguage);
    },
    preferenceData() {
      return this.$store.getters.preferenceData;
    },
    primaryLanguage: {
      get() {
        return this.$store.getters.primaryLanguage;
      },
      set(val) {
        this.$store.dispatch('primaryLanguage', val).then(() => {
          electron.ipcRenderer.send('preference-to-main', this.preferenceData);
        });
      },
    },
    secondaryLanguage: {
      get() {
        return this.$store.getters.secondaryLanguage;
      },
      set(val) {
        this.$store.dispatch('secondaryLanguage', val).then(() => {
          electron.ipcRenderer.send('preference-to-main', this.preferenceData);
        });
      },
    },
    privacyAgreement: {
      get() {
        return this.$store.getters.privacyAgreement;
      },
      set(val) {
        if (val) {
          this.$store.dispatch('agreeOnPrivacyPolicy').then(() => {
            electron.ipcRenderer.send('preference-to-main', this.preferenceData);
          });
        } else {
          this.$store.dispatch('disagreeOnPrivacyPolicy').then(() => {
            electron.ipcRenderer.send('preference-to-main', this.preferenceData);
          });
        }
      },
    },
  },
  methods: {
    codeToLanguageName(code) {
      if (!code) return this.noLanguage;
      return codeToLanguageName(code);
    },
    handleFirstSelection(selection) {
      if (selection === this.secondaryLanguage) this.secondaryLanguage = '';
      this.primaryLanguage = selection;
      this.showFirstSelection = false;
    },
    handleSecondSelection(selection, index) {
      if (selection !== this.primaryLanguage) {
        this.secondaryLanguage = selection;
        this.showSecondSelection = false;
      }
    },
    openFirstDropdown() {
      if (this.privacyAgreement) {
        if (this.showFirstSelection) {
          this.showFirstSelection = false;
        } else {
          this.showFirstSelection = true;
          this.showSecondSelection = false;
        }
      }
    },
    openSecondDropdown() {
      if (this.privacyAgreement) {
        if (this.showSecondSelection) {
          this.showSecondSelection = false;
        } else {
          this.showSecondSelection = true;
          this.showFirstSelection = false;
        }
      }
    },
  },
};
</script>
<style scoped lang="scss">
.privicy {
  .checkbox:nth-of-type(1) {
    margin-top: 0;
  }
}
.tabcontent {
  .settingItem {
    &__attached {
      background-color: rgba(0,0,0,0.05);
      margin-top: 15px;
      padding: 20px 28px;

      table {
        width: 100%;
        tr {
          height: 40px;
        }
      }
    }

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

    tr:nth-of-type(1) .dropdown {
      z-index: 1;
    }
  }
  .dropdown {
    position: relative;
    width: 240px;
    height: 28px;

    &__title {
      height: 28px;
      text-overflow: ellipsis;
      white-space: nowrap;
      width: 10%;
      padding-right: 10px;
      line-height: 28px;
      font-family: $font-medium;
      font-size: 12px;
      color: rgba(255,255,255,0.7);
    }
    
    &__toggle {
      position: absolute;
      top: 0;
      width: 100%;
      margin-top: -1px;
      margin-left: -1px;
      transition: all 200ms;
      border-radius: 2px;
      overflow: hidden;
      -webkit-app-region: no-drag;
      
      &--display {
        @extend .dropdown__toggle;
        height: 28px;
        border: 1px solid rgba(255,255,255,0);
        background-color: rgba(255, 255, 255, 0);
      }
      
      &--list { 
        @extend .dropdown__toggle;
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
      background: rgba(255,255,255,0.1);
      border-radius: 1.5px;
    }
    ::-webkit-scrollbar-track {
      cursor: pointer;
      border-radius: 2px;
      width: 10px;
      user-select: none;
    }
  }
}
</style>
