
#import "RNBlocksoftRandom.h"

@implementation RNBlocksoftRandom

- (dispatch_queue_t)methodQueue
{
    return dispatch_get_main_queue();
}

RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;

RCT_EXPORT_METHOD(getRandomBytesPublic:(NSUInteger)length
                  getRandomBytesPublicResolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    NSMutableData* bytes = [NSMutableData dataWithLength:length];
    int result = SecRandomCopyBytes(kSecRandomDefault,length, [bytes mutableBytes]);
    if (result == errSecSuccess) {
        resolve([bytes base64EncodedStringWithOptions:0]);
    } else {
        NSError *error = [NSError errorWithDomain:@"RNSecureRandom" code:result userInfo: nil];
        reject(@"randombytes_error", @"Error generating random bytes", error);
    }
}

+ (BOOL)requiresMainQueueSetup {
    return NO;
}

@end
