//
//  KIFUITestActor+EXAdditions.h
//  Trusteewallet-kif-tests
//
//  Created by NeoSPU on 4/27/21.
//

#import <Foundation/Foundation.h>

#import <KIF/KIF.h>

@interface KIFUITestActor (EXAdditions)

//==============================================================================
/** Start the application. The app must be opened at the WALLET SCREEN with accessibility label like this ""TRUSTEE_WALLET_LABEL"".
*/

- (void)navigateToHomeScreen;


//==============================================================================

@end
