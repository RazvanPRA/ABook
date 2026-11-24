#import "AbookTts.h"

#import <AVFoundation/AVFoundation.h>

@interface AbookTts () <AVSpeechSynthesizerDelegate>
@end

@implementation AbookTts {
  AVSpeechSynthesizer *_synthesizer;
  /// Ids of the utterances not over yet; keys are compared by identity.
  NSMapTable<AVSpeechUtterance *, NSString *> *_ids;
  BOOL _sessionActive;
}

RCT_EXPORT_MODULE(AbookTts)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

/// AVSpeechSynthesizer calls its delegate on the main queue; so is everything else.
- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (instancetype)init
{
  if (self = [super init]) {
    _ids = [NSMapTable mapTableWithKeyOptions:NSPointerFunctionsStrongMemory |
                                              NSPointerFunctionsObjectPointerPersonality
                                 valueOptions:NSPointerFunctionsStrongMemory];
    NSNotificationCenter *center = NSNotificationCenter.defaultCenter;
    [center addObserver:self
               selector:@selector(onInterruption:)
                   name:AVAudioSessionInterruptionNotification
                 object:nil];
    [center addObserver:self
               selector:@selector(onRouteChange:)
                   name:AVAudioSessionRouteChangeNotification
                 object:nil];
  }
  return self;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeAbookTtsSpecJSI>(params);
}

- (void)invalidate
{
  [NSNotificationCenter.defaultCenter removeObserver:self];
  dispatch_async(dispatch_get_main_queue(), ^{
    [self silence];
  });
}

#pragma mark - Spec

- (void)getVoices:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  NSMutableArray<NSDictionary *> *voices = [NSMutableArray new];
  // Only installed voices are listed, and all of them speak offline
  for (AVSpeechSynthesisVoice *voice in AVSpeechSynthesisVoice.speechVoices) {
    [voices addObject:@{
      @"id" : voice.identifier,
      @"name" : voice.name,
      @"language" : voice.language,
      @"quality" : @(voice.quality),
      @"network" : @NO,
      @"installed" : @YES,
    }];
  }
  resolve(voices);
}

- (void)speak:(JS::NativeAbookTts::SpeakRequest &)request
{
  NSString *utteranceId = request.id_();
  NSString *voiceId = request.voiceId();
  AVSpeechSynthesisVoice *voice =
      voiceId ? [AVSpeechSynthesisVoice voiceWithIdentifier:voiceId] : nil;
  voice = voice ?: [AVSpeechSynthesisVoice voiceWithLanguage:request.language()];
  if (voice == nil) {
    [self emit:utteranceId type:@"error" code:@"language"];
    return;
  }
  if (![self activateSession]) {
    [self emitOnPlaybackCommand:@{@"type" : @"interruption"}];
    return;
  }
  AVSpeechUtterance *utterance = [AVSpeechUtterance speechUtteranceWithString:request.text()];
  utterance.voice = voice;
  utterance.rate = [AbookTts speechRate:request.rate()];
  utterance.pitchMultiplier = (float)request.pitch();
  [self.synthesizer stopSpeakingAtBoundary:AVSpeechBoundaryImmediate];
  [_ids setObject:utteranceId forKey:utterance];
  [self.synthesizer speakUtterance:utterance];
}

- (void)stop:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  [self silence];
  resolve(nil);
}

- (void)isSpeaking:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  resolve(@(_synthesizer.isSpeaking));
}

- (void)openSettings:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  reject(@"settings", @"iOS has no link to its voice settings", nil);
}

// iOS keeps playing through the audio session; there is no service to show.
- (void)showPlayback:(JS::NativeAbookTts::PlaybackNotice &)info
{
}

- (void)hidePlayback
{
}

#pragma mark - AVSpeechSynthesizerDelegate

- (void)speechSynthesizer:(AVSpeechSynthesizer *)synthesizer
    didStartSpeechUtterance:(AVSpeechUtterance *)utterance
{
  [self emit:[_ids objectForKey:utterance] type:@"start" code:@""];
}

- (void)speechSynthesizer:(AVSpeechSynthesizer *)synthesizer
    didFinishSpeechUtterance:(AVSpeechUtterance *)utterance
{
  NSString *utteranceId = [_ids objectForKey:utterance];
  [_ids removeObjectForKey:utterance];
  [self emit:utteranceId type:@"done" code:@""];
}

- (void)speechSynthesizer:(AVSpeechSynthesizer *)synthesizer
    didCancelSpeechUtterance:(AVSpeechUtterance *)utterance
{
  [_ids removeObjectForKey:utterance];
}

#pragma mark - Audio session

- (BOOL)activateSession
{
  if (_sessionActive) {
    return YES;
  }
  AVAudioSession *session = AVAudioSession.sharedInstance;
  NSError *error = nil;
  [session setCategory:AVAudioSessionCategoryPlayback
                  mode:AVAudioSessionModeSpokenAudio
               options:0
                 error:&error];
  _sessionActive = error == nil && [session setActive:YES error:&error];
  return _sessionActive;
}

- (void)onInterruption:(NSNotification *)notification
{
  NSNumber *type = notification.userInfo[AVAudioSessionInterruptionTypeKey];
  if (type.unsignedIntegerValue == AVAudioSessionInterruptionTypeBegan) {
    [self interrupt];
  }
}

- (void)onRouteChange:(NSNotification *)notification
{
  NSNumber *reason = notification.userInfo[AVAudioSessionRouteChangeReasonKey];
  if (reason.unsignedIntegerValue == AVAudioSessionRouteChangeReasonOldDeviceUnavailable) {
    [self interrupt];
  }
}

/// Both notifications come on any queue.
- (void)interrupt
{
  dispatch_async(dispatch_get_main_queue(), ^{
    self->_sessionActive = NO;
    [self emitOnPlaybackCommand:@{@"type" : @"interruption"}];
  });
}

#pragma mark - Helpers

- (AVSpeechSynthesizer *)synthesizer
{
  if (_synthesizer == nil) {
    _synthesizer = [AVSpeechSynthesizer new];
    _synthesizer.delegate = self;
  }
  return _synthesizer;
}

- (void)silence
{
  [_synthesizer stopSpeakingAtBoundary:AVSpeechBoundaryImmediate];
  if (_sessionActive) {
    _sessionActive = NO;
    [AVAudioSession.sharedInstance
          setActive:NO
        withOptions:AVAudioSessionSetActiveOptionNotifyOthersOnDeactivation
              error:nil];
  }
}

- (void)emit:(nullable NSString *)utteranceId type:(NSString *)type code:(NSString *)code
{
  if (utteranceId != nil) {
    [self emitOnUtterance:@{@"id" : utteranceId, @"type" : type, @"code" : code}];
  }
}

/// 1 is the normal rate of the app's scale; AVSpeech calls it 0.5 and reaches twice as fast well
/// before its maximum of 1, so the upper half is compressed.
+ (float)speechRate:(double)rate
{
  double normal = AVSpeechUtteranceDefaultSpeechRate;
  double value = rate <= 1 ? normal * rate : normal + (rate - 1) * 0.15;
  return (float)MIN(MAX(value, AVSpeechUtteranceMinimumSpeechRate),
                    AVSpeechUtteranceMaximumSpeechRate);
}

@end
