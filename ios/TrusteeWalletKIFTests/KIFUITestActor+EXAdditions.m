//
//  KIFUITestActor+EXAdditions.h
//  Trusteewallet-kif-tests
//
//  Created by NeoSPU on 4/27/21.
//

#import "KIFUITestActor+EXAdditions.h"
#import "ConstantsAccessibility.h"

//==============================================================================

typedef void(^QueueBlock)(void);

//==============================================================================


@implementation KIFUITestActor (EXAdditions)


//==============================================================================

- (void)navigateToHomeScreen
{
    [self waitForViewWithAccessibilityLabel:ktrusteewalletHomeScreenAccessibilityLabel];
}

//==============================================================================

@end
