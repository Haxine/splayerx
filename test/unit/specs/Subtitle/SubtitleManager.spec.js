import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import { createSandbox, match } from 'sinon';
import { merge } from 'lodash';
import Subtitle from '@/store/modules/Subtitle';
import Video from '@/store/modules/Video';
import Preference from '@/store/modules/Preference';
import SubtitleManager, { __RewireAPI__ as subtitleManagerRewireAPI } from '@/components/Subtitle/SubtitleManager.vue';
import SubtitleLoader from '@/components/Subtitle/SubtitleLoader';

const localVue = createLocalVue();
localVue.use(Vuex);
const randStr = () => Math.random().toString(36).substring(7);
const errorVideoSrc = '11-22-33-44';

describe('Subtitle Manager Unit Tests', () => {
  let store;
  const baseStore = {
    modules: {
      Video: {
        state: Video.state,
        getters: Video.getters,
        mutations: Video.mutations,
        actions: Video.mutations,
      },
      Subtitle: {
        state: Subtitle.state,
        getters: Subtitle.getters,
        mutations: Subtitle.mutations,
        actions: Subtitle.actions,
      },
      Preference: {
        state: Preference.state,
        getters: Preference.getters,
        mutations: Preference.mutations,
        actions: Preference.actions,
      },
    },
  };
  let wrapper;
  let sandbox;

  beforeEach(() => {
    sandbox = createSandbox();

    store = new Vuex.Store(baseStore);
    wrapper = shallowMount(SubtitleManager, { localVue, store });
  });

  afterEach(() => {
    wrapper.destroy();
    sandbox.restore();
  });

  it('Sanity test - should SubtitleManager be properly rendered', () => {
    expect(wrapper.contains(SubtitleManager)).to.equal(true);
  });

  describe('method - refreshSubtitles', () => {
    let videoSrc;
    let refreshSubtitles;
    let storeLanguagePreferenceStub;
    beforeEach(() => {
      videoSrc = randStr();
      ({ refreshSubtitles } = wrapper.vm);

      storeLanguagePreferenceStub = sandbox.stub().resolves();
      subtitleManagerRewireAPI.__Rewire__('storeLanguagePreference', storeLanguagePreferenceStub);
    });

    it('should throw error when no valid types provided', (done) => {
      refreshSubtitles([])
        .then(res => done(res))
        .catch((err) => {
          expect(err)
            .to.be.an.instanceOf(Error)
            .with.property('message', 'No valid subtitle type provided.');
          done();
        });
    });
    it('should invoke getLocalSubtitlesList when types includes local', () => {
      const getLocalSubtitlesListSpy = sandbox.spy(wrapper.vm, 'getLocalSubtitlesList');

      refreshSubtitles(['local'], videoSrc);

      sandbox.assert.calledWithExactly(getLocalSubtitlesListSpy, videoSrc);
    });
    it('should invoke getEmbeddedSubtitlesList when types includes embedded', () => {
      const getEmbeddedSubtitlesListSpy = sandbox.spy(wrapper.vm, 'getEmbeddedSubtitlesList');

      refreshSubtitles(['embedded'], videoSrc);

      sandbox.assert.calledWithExactly(getEmbeddedSubtitlesListSpy, videoSrc);
    });
    it('should invoke resetOnlineSubtitles when types includes online', () => {
      const resetOnlineSubtitlesSpy = sandbox.spy(wrapper.vm, 'resetOnlineSubtitles');

      refreshSubtitles(['online'], videoSrc);

      sandbox.assert.calledOnce(resetOnlineSubtitlesSpy);
    });
    it('should invoke getOnlineSubtitlesList when types includes online', () => {
      const getOnlineSubtitlesListSpy = sandbox.spy(wrapper.vm, 'getOnlineSubtitlesList');
      const { preferredLanguages } = wrapper.vm;

      refreshSubtitles(['online'], videoSrc);

      sandbox.assert.calledWithExactly(getOnlineSubtitlesListSpy, videoSrc, preferredLanguages);
    });

    it('should refreshSubtitles set selectionComplete to false', () => {
      wrapper.setData({ selectionComplete: true });
      expect(wrapper.vm.selectionComplete).to.equal(true);

      refreshSubtitles(['local'], videoSrc);
      expect(wrapper.vm.selectionComplete).to.equal(false);
    });

    it('should invoke checkCurrentSubtitleList', () => {
      const checkCurrentSubtitleListSpy = sandbox.spy(wrapper.vm, 'checkCurrentSubtitleList');

      refreshSubtitles(['local'], videoSrc);

      sandbox.assert.calledOnce(checkCurrentSubtitleListSpy);
    });

    it('should emit bus event "refresh-finished" when all subtitles are loaded', (done) => {
      const eventBusEmitSpy = sandbox.spy(wrapper.vm.$bus, '$emit');
      refreshSubtitles(['local'], videoSrc)
        .then(() => {
          sandbox.assert.calledWithExactly(eventBusEmitSpy, 'refresh-finished');
          done();
        })
        .catch(done);
    });

    it('should invoke checkCurrentSubtitleList when all subtitles are loaded', (done) => {
      const checkCurrentSubtitleListSpy = sandbox.spy(wrapper.vm, 'checkCurrentSubtitleList');

      refreshSubtitles(['local'], videoSrc)
        .then(() => {
          sandbox.assert.called(checkCurrentSubtitleListSpy);
          done();
        })
        .catch(done);
    });

    it('should invoke storeLanguagePreference when all loaded', (done) => {
      refreshSubtitles(['local'], videoSrc)
        .then(() => {
          sandbox.assert.calledWithExactly(
            storeLanguagePreferenceStub,
            videoSrc,
            wrapper.vm.preferredLanguages,
          );
          done();
        }).catch(done);
    });
  });

  describe('method - getLocalSubtitlesList', () => {
    let videoSrc;
    let getLocalSubtitlesList;
    let searchForLocalListStub;

    beforeEach(() => {
      searchForLocalListStub = sandbox.stub().resolves();
      searchForLocalListStub.withArgs(errorVideoSrc).rejects();
      SubtitleManager.__Rewire__('searchForLocalList', searchForLocalListStub);
      ({ getLocalSubtitlesList } = wrapper.vm);
    });
    afterEach(() => {
      SubtitleManager.__ResetDependency__('searchForLocalList');
    });

    it('should invoke searchForLocalList', () => {
      getLocalSubtitlesList();

      sandbox.assert.calledOnce(searchForLocalListStub);
    });

    it('should invoke searchForLocalList with videoSrc and SubtitleLoader.supportedFormats', () => {
      getLocalSubtitlesList(videoSrc);
      const { supportedFormats } = SubtitleLoader;

      sandbox.assert.calledWithExactly(searchForLocalListStub, videoSrc, supportedFormats);
    });

    it('should slience errors rejected from searchForLocalList', (done) => {
      getLocalSubtitlesList(errorVideoSrc)
        .then((results) => {
          expect(results.length).to.equal(0);
          done();
        })
        .catch(done);
    });
  });

  describe('method - getOnlineSubtitlesList', () => {
    let videoSrc;
    let getOnlineSubtitlesList;
    let fetchOnlineListStub;

    beforeEach(() => {
      videoSrc = randStr();
      ({ getOnlineSubtitlesList } = wrapper.vm);

      fetchOnlineListStub = sandbox.stub().resolves(videoSrc.split(''));
      fetchOnlineListStub.withArgs(errorVideoSrc).rejects();
      SubtitleManager.__Rewire__('fetchOnlineList', fetchOnlineListStub);
    });

    afterEach(() => {
      SubtitleManager.__ResetDependency__('fetchOnlineList');
    });

    it('should resolve an empty array when no languages provided', (done) => {
      getOnlineSubtitlesList(videoSrc)
        .then((results) => {
          expect(results).to.deep.equal([]);
          done();
        })
        .catch(done);
    });

    it('should invoke fetchOnlineList', () => {
      getOnlineSubtitlesList(videoSrc, [randStr()]);

      sandbox.assert.called(fetchOnlineListStub);
    });

    it('should invoke fetchOnlineList with videoSrc and language', () => {
      const randomLanguages = [randStr(), randStr()];
      getOnlineSubtitlesList(videoSrc, randomLanguages);

      sandbox.assert.calledWithExactly(
        fetchOnlineListStub.firstCall,
        videoSrc,
        randomLanguages[0],
      );
      sandbox.assert.calledWithExactly(
        fetchOnlineListStub.secondCall,
        videoSrc,
        randomLanguages[1],
      );
    });

    it('should slience errors from fetchOnlineList', (done) => {
      const languages = [randStr(), errorVideoSrc];
      getOnlineSubtitlesList(videoSrc, languages)
        .then((results) => {
          expect(results).to.not.include([...errorVideoSrc.split('')]);
          done();
        })
        .catch(done);
    });
  });

  describe('method - getEmbeddedSubtitlesList', () => {
    let videoSrc;
    let getEmbeddedSubtitlesList;
    let retrieveEmbeddedListStub;

    beforeEach(() => {
      videoSrc = randStr();
      ({ getEmbeddedSubtitlesList } = wrapper.vm);

      retrieveEmbeddedListStub = sandbox.stub().resolves();
      retrieveEmbeddedListStub.withArgs(errorVideoSrc).rejects();
      SubtitleManager.__Rewire__('retrieveEmbeddedList', retrieveEmbeddedListStub);
    });
    afterEach(() => {
      SubtitleManager.__ResetDependency__('retrieveEmbeddedList');
    });

    it('should invoke retrieveEmbeddedList', () => {
      getEmbeddedSubtitlesList(videoSrc);

      sandbox.assert.called(retrieveEmbeddedListStub);
    });

    it('should invoke retrieveEmbeddedList with videoSrc and SubtitleLoader.supportedCodecs', () => {
      getEmbeddedSubtitlesList(videoSrc);
      const { supportedCodecs } = SubtitleLoader;

      sandbox.assert.calledWithExactly(retrieveEmbeddedListStub, videoSrc, supportedCodecs);
    });

    it('should slience errors rejected from retrieveEmbeddedList to an empty array', (done) => {
      getEmbeddedSubtitlesList(errorVideoSrc)
        .then((results) => {
          expect(results).to.deep.equal([]);
          done();
        })
        .catch(done);
    });
  });

  describe('method - generateValidSubtitle', () => {
    let subtitleId;
    const testSubtitleId = 'testSubtitle';
    const testSubtitleInstance = {
      type: 'local',
      src: randStr(),
      data: randStr(),
    };
    const testSubtitleInstances = { [testSubtitleId]: testSubtitleInstance };
    const testSubtitleInfo = {
      id: testSubtitleId,
      language: 'zh-CN',
      name: `${randStr()}.ass`,
      rank: 1000,
      format: 'ass',
    };
    const testSubtitleList = [testSubtitleInfo];
    beforeEach(() => {
      subtitleId = randStr();
      const subtitleListStore = merge({}, baseStore, {
        modules: {
          Subtitle: {
            getters: {
              subtitleList: () => testSubtitleList,
            },
          },
        },
      });
      wrapper = shallowMount(SubtitleManager, {
        localVue,
        store: new Vuex.Store(subtitleListStore),
      });
      wrapper.vm.subtitleInstances = testSubtitleInstances;
    });

    it('should throw error when no subtitleInstance found', (done) => {
      testSubtitleList.push({ id: subtitleId });
      wrapper.vm.generateValidSubtitle(subtitleId)
        .catch((err) => {
          expect(err).to.be.an.instanceOf(Error);
          done();
        }).then(done);
    });
    it('should throw error when no subtitleInfo found', (done) => {
      wrapper.vm.subtitleInstances = { ...testSubtitleInstances, subtitleId: {} };
      wrapper.vm.generateValidSubtitle(subtitleId)
        .catch((err) => {
          expect(err).to.be.an.instanceOf(Error);
          done();
        }).then(done);
    });
    it('should resolves the proper subtitleInfo', (done) => {
      wrapper.vm.generateValidSubtitle(testSubtitleId)
        .then((result) => {
          expect(result).to.have.property('id');
          expect(result).to.have.property('type');
          expect(result).to.have.property('src');
          expect(result).to.have.property('format');
          expect(result).to.have.property('language');
          done();
        }).catch(done);
    });
    it('should generate proper subtitleInfo for local subtitles', (done) => {
      wrapper.vm.generateValidSubtitle(testSubtitleId)
        .then((result) => {
          const { src } = testSubtitleInstance;
          const { format } = testSubtitleInfo;
          expect(result).to.have.property('id', testSubtitleId);
          expect(result).to.have.property('type', 'local');
          expect(result).to.have.property('src', src);
          expect(result).to.have.property('format', format);
          expect(result.data).to.not.exist;
          done();
        }).catch(done);
    });
    it('should generate proper subtitleInfo for embedded subtitles', (done) => {
      testSubtitleInstance.type = 'embedded';
      wrapper.vm.generateValidSubtitle(testSubtitleId)
        .then((result) => {
          testSubtitleInstance.type = 'embedded';
          const { src } = testSubtitleInstance;
          const { format } = testSubtitleInfo;
          expect(result).to.have.property('id', testSubtitleId);
          expect(result).to.have.property('type', 'embedded');
          expect(result).to.have.property('src', src);
          expect(result).to.have.property('format', format);
          expect(result.data).to.not.exist;
          done();
        }).catch(done);
    });
    it('should generate proper subtitleInfo for online subtitles', (done) => {
      testSubtitleInstance.type = 'online';
      wrapper.vm.generateValidSubtitle(testSubtitleId)
        .then((result) => {
          testSubtitleInstance.type = 'online';
          const { src, data } = testSubtitleInstance;
          const { format } = testSubtitleInfo;
          expect(result).to.have.property('id', testSubtitleId);
          expect(result).to.have.property('type', 'online');
          expect(result).to.have.property('src', src);
          expect(result).to.have.property('format', format);
          expect(result).to.have.property('data', data);
          done();
        }).catch(done);
    });
  });

  describe('method - generateValidSubtitleList', () => {
    let videoSrc;
    let testVideoSegments;
    const testCurrentSubtitleId = 'testCurrentSubtitleId';
    let testCurrentSubtitle;
    let testSubtitleWithName;
    let testSubtitleList;
    beforeEach(() => {
      videoSrc = randStr();
      testCurrentSubtitle = {
        id: testCurrentSubtitleId,
        src: randStr(),
        type: 'local',
        rank: 9999,
      };
      testVideoSegments = [[Math.random(), Math.random() + 5]];
      testSubtitleWithName = {
        id: randStr(),
        src: randStr(),
        type: 'online',
        name: 'Chinese I',
        rank: 9997,
      };
      testSubtitleList = [testCurrentSubtitle, testSubtitleWithName];
      const subtitleListStore = merge({}, baseStore, {
        modules: {
          Subtitle: {
            getters: {
              currentSubtitleId: () => testCurrentSubtitleId,
              subtitleList: () => testSubtitleList,
            },
          },
          Video: {
            getters: {
              duration: () => 1, // to trigger SubtitleRenderer's v-if
            },
          },
        },
      });
      const SubtitleRendererStub = {
        render(h) { return h('div'); },
        data() { return { videoSegments: testVideoSegments }; },
      };
      wrapper = shallowMount(SubtitleManager, {
        localVue,
        store: new Vuex.Store(subtitleListStore),
        stubs: {
          SubtitleRenderer: SubtitleRendererStub,
        },
      });
      wrapper.setData({
        subtitleInstances: { [testCurrentSubtitleId]: testCurrentSubtitle },
      });
    });

    it('should generateValidSubtitleList generate proper subtitleList', (done) => {
      wrapper.vm.generateValidSubtitleList(videoSrc)
        .then((result) => {
          expect(result).to.has.property('videoSrc', videoSrc);
          result.subtitles.forEach((subtitleInfo) => {
            const {
              id, type, name, rank,
            } = testSubtitleList.find(({ id }) => id === subtitleInfo.id);
            expect(subtitleInfo).to.have.property('id', id);
            expect(subtitleInfo).to.have.property('type', type);
            expect(subtitleInfo).to.have.property('name', name);
            expect(subtitleInfo).to.have.property('rank', rank);
            if (subtitleInfo.id === testCurrentSubtitleId) {
              expect(subtitleInfo).to.have.property('videoSegments', testVideoSegments);
            }
          });
          done();
        }).catch(done);
    });
  });

  describe('method - loadedCallback', () => {
    let testSubtitleInstance;
    let addSubtitleWhenLoadedStub;
    let updateSubtitleStub;
    beforeEach(() => {
      testSubtitleInstance = {
        id: randStr(),
        type: 'online',
        metaInfo: {
          language: 'zh-CN',
        },
        data: [randStr()],
      };
      addSubtitleWhenLoadedStub = sandbox.stub(wrapper.vm, 'addSubtitleWhenLoaded');
      updateSubtitleStub = sandbox.stub();
      subtitleManagerRewireAPI.__Rewire__('updateSubtitle', updateSubtitleStub);
    });
    afterEach(() => {
      subtitleManagerRewireAPI.__ResetDependency__('updateSubtitle');
    });
    it('should invoke addSubtitleWhenLoaded', (done) => {
      wrapper.vm.loadedCallback(testSubtitleInstance)
        .then(() => {
          expect(addSubtitleWhenLoadedStub)
            .to.have.been.calledWithExactly({ id: testSubtitleInstance.id });
          done();
        }).catch(done);
    });
    it('should invoke updateSubtitle', (done) => {
      wrapper.vm.loadedCallback(testSubtitleInstance)
        .then(() => {
          expect(updateSubtitleStub).to.have.been.called;
          done();
        }).catch(done);
    });
    it('should invoke updateSubtitle with language and data when online', (done) => {
      wrapper.vm.loadedCallback(testSubtitleInstance)
        .then(() => {
          expect(updateSubtitleStub).to.have.been.calledWithExactly(
            testSubtitleInstance.id,
            {
              language: testSubtitleInstance.metaInfo.language,
              data: testSubtitleInstance.data,
            },
          );
          done();
        }).catch(done);
    });
    it('should invoke updateSubtitle with only language when not online', (done) => {
      testSubtitleInstance.type = 'local';
      wrapper.vm.loadedCallback(testSubtitleInstance)
        .then(() => {
          expect(updateSubtitleStub).to.have.been.calledWithExactly(
            testSubtitleInstance.id,
            {
              language: testSubtitleInstance.metaInfo.language,
            },
          );
          done();
        }).catch(done);
    });
  });

  describe('method - allSubtitleListWacher', () => {
    let updateSubtitleListStub;
    let testVideoSrc;
    let getVideoSrcByIdStub;
    let loadingSubtitle;
    let failedSubtitle;
    let readySubtitle;
    let loadedSubtitle;
    beforeEach(() => {
      updateSubtitleListStub = sandbox.stub();
      subtitleManagerRewireAPI.__Rewire__('updateSubtitleList', updateSubtitleListStub);
      testVideoSrc = randStr();
      getVideoSrcByIdStub = sandbox.stub().returns(testVideoSrc);
      store = merge({}, baseStore, {
        modules: {
          Subtitle: {
            getters: {
              getVideoSrcById: () => getVideoSrcByIdStub,
            },
          },
        },
      });
      wrapper = shallowMount(SubtitleManager, { localVue, store: new Vuex.Store(store) });

      loadingSubtitle = { id: randStr(), loading: 'loading' };
      failedSubtitle = { id: randStr(), loading: 'failed' };
      readySubtitle = { id: randStr(), loading: 'ready' };
      loadedSubtitle = { id: randStr(), loading: 'loaded' };
    });
    afterEach(() => {
      subtitleManagerRewireAPI.__ResetDependency__('updateSubtitleList');
    });

    it('should invoke updateSubtitleList', () => {
      const newVal = [readySubtitle, loadedSubtitle];
      const oldVal = [readySubtitle];

      wrapper.vm.allSubtitleListWatcher(newVal, oldVal);

      expect(updateSubtitleListStub).to.have.been.called;
    });
    it('should only update the new ready or loaded subtitles', (done) => {
      const newVal = [readySubtitle, loadedSubtitle, failedSubtitle, loadingSubtitle];
      const oldVal = [];

      wrapper.vm.allSubtitleListWatcher(newVal, oldVal)
        .then(() => {
          expect(updateSubtitleListStub).to.have.been.calledWithMatch(
            testVideoSrc,
            match.array.deepEquals([readySubtitle, loadedSubtitle]),
          );
          done();
        }).catch(done);
    });
    it('should invoke updateSubtitle with proper videoSrc', (done) => {
      const testVideoSrc1 = randStr();
      const testVideoSrc2 = randStr();
      getVideoSrcByIdStub.onFirstCall().returns(testVideoSrc1);
      getVideoSrcByIdStub.onSecondCall().returns(testVideoSrc2);
      const newVal = [readySubtitle, loadedSubtitle];
      const oldVal = [];

      wrapper.vm.allSubtitleListWatcher(newVal, oldVal)
        .then(() => {
          expect(updateSubtitleListStub).to.have.been.calledWithExactly(
            testVideoSrc1,
            [readySubtitle],
          );
          expect(updateSubtitleListStub).to.have.been.calledWithExactly(
            testVideoSrc2,
            [loadedSubtitle],
          );
          done();
        }).catch(done);
    });
  });
});
