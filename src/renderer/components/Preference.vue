<template>
  <div class="preference tablist">
    <div class="tablist__tabs">
      <div class="titlebar titlebar--mac no-drag"
        v-if="isDarwin"
        @mouseover="state = 'hover'"
        @mouseout="state = 'default'">
        <Icon class="titlebar__button"
              type="titleBarClose"
              :state="state"
              @click.native="handleClose"/>
        <Icon class="titlebar__button--disable" type="titleBarExitFull"/>
        <Icon class="titlebar__button--disable" type="titleBarFull"/>
      </div>
      <div class="tablist__tab"
          :class="currentPreference === 'General' ? 'tablist__tab--selected' : ''"
          @mouseup="handleMouseup('General')">{{ $t('preferences.general.generalSetting') }}</div>
      <div class="tablist__tab"
          :class="currentPreference === 'Privacy' ? 'tablist__tab--selected' : ''"
          @mouseup="handleMouseup('Privacy')">{{ $t('preferences.privacy.privacySetting') }}</div>
    </div>
    <div class="tablist__tabpanel">
      <div class="titlebar titlebar--win no-drag"
        v-if="!isDarwin"
        @mouseover="state = 'hover'"
        @mouseout="state = 'default'">
        <Icon class="titlebar__button--disable"
              type="titleBarWinExitFull"/>
        <Icon class="titlebar__button--disable" type="titleBarWinFull"/>
        <Icon class="titlebar__button" type="titleBarWinClose" @click.native="handleClose"/>
      </div>
      <div class="tablist__tabcontent">
        <keep-alive>
          <component :is="currentPreference"
          @move-stoped="isMoved = false"
          :mouseDown="mouseDown" :isMoved="isMoved"/>
        </keep-alive>
      </div>
    </div>
  </div>
</template>

<script>
import electron from 'electron';
import Icon from '@/components/BaseIconContainer.vue';
import General from './Preferences/General.vue';
import Privacy from './Preferences/Privacy.vue';

export default {
  name: 'Preference',
  components: {
    Icon,
    General,
    Privacy,
  },
  data() {
    return {
      state: 'default',
      currentPreference: 'General',
      mouseDown: false,
      isMoved: false,
    };
  },
  computed: {
    isDarwin() {
      return process.platform === 'darwin';
    },
  },
  methods: {
    // Methods to handle window behavior
    handleClose() {
      electron.remote.getCurrentWindow().close();
    },
    mainDispatchProxy(actionType, actionPayload) {
      this.$store.dispatch(actionType, actionPayload);
    },
    handleMouseup(panel) {
      this.currentPreference = panel;
    },
  },
  created() {
    electron.ipcRenderer.on('preferenceDispatch', (event, actionType, actionPayload) => {
      this.mainDispatchProxy(actionType, actionPayload);
    });
    window.onmousedown = () => {
      this.mouseDown = true;
      this.isMoved = false;
    };
    window.onmousemove = () => {
      if (this.mouseDown) this.isMoved = true;
    };
    window.onmouseup = () => {
      this.mouseDown = false;
    };
  },
  beforeDestroy() {
    window.onmousedown = null;
    window.onmousemove = null;
    window.onmouseup = null;
  },
};
</script>

<style scoped lang="scss">
.preference {
  .titlebar {
    display: flex;
    flex-wrap: nowrap;

    &--mac {
      margin-top: 12px;
      margin-left: 12px;
      margin-bottom: 18px;
      width: fit-content;
      
      .titlebar__button {
        margin-right: 8px;
        width: 12px;
        height: 12px;
        background-repeat: no-repeat;
        -webkit-app-region: no-drag;
        border-radius: 100%;

        &--disable {
          pointer-events: none;
          opacity: 0.25;
        }
      }
    }

    &--win {
      top: 0;
      right: 0;
      position: fixed;

      .titlebar__button {
        margin: 0px 2px 2px 0px;
        width: 45px;
        height: 28px;
        background-color: rgba(255,255,255,0);
        transition: background-color 200ms;

        &--disable {
          pointer-events: none;
          opacity: 0.25;
        }
        &:hover {
          background-color: rgba(221, 221, 221, 0.2);
        }
        &:active {
          background-color: rgba(221, 221, 221, 0.5);
        }
      }
    }
  }
}
.tablist {
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;

  &__tabs {
    width: 110px;
    height: 100%;
    background-image: linear-gradient(-28deg, rgba(65,65,65,0.97) 0%, rgba(84,84,84,0.97) 47%, rgba(123,123,123,0.97) 100%);
  }

  &__tab {
    cursor: pointer;
    -webkit-app-region: no-drag;
    font-family: $font-semibold;
    font-size: 14px;
    padding-left: 15px;
    letter-spacing: 0;
    line-height: 42px;
    color: rgba(255,255,255,0.3);
    border-left: 1px solid rgba(0,0,0,0);
    background-color: rgba(255,255,255,0);
    transition: background-color 200ms;
    &:hover {
      background-color: rgba(255,255,255,0.03);
    }

    &--selected {
      color: rgba(255,255,255,1);
      border-left: 1px solid white;
      background-image: linear-gradient(99deg, rgba(243,243,243,0.15) 0%, rgba(255,255,255,0.0675) 81%);
      &:hover {
        background-color: rgba(255,255,255,0);
      }
    }
  }

  &__tabpanel {
    width: 430px;
    background-image: linear-gradient(-28deg, rgba(65,65,65,0.99) 0%, rgba(84,84,84,0.99) 47%, rgba(123,123,123,0.99) 100%);
  }

  &__tabcontent {
    padding: 32px 32px;
  }
}
</style>
