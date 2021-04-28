//
//  Trusteewallet_kif_tests.m
//  Trusteewallet-kif-tests
//
//  Created by NeoSPU on 4/27/21.
//
//

#import <XCTest/XCTest.h>

#import <KIF/KIF.h>

#import "KIFUITestActor+EXAdditions.h"

#import "ConstantsAccessibility.h"


@interface Trusteewallet_kif_tests : KIFTestCase

@end

@implementation Trusteewallet_kif_tests

-(void)beforeAll {
    
  NSDictionary* infoDict = [[NSBundle mainBundle] infoDictionary];
  NSString* productMode = infoDict[@"KIF_TEST"];
  NSLog(@"KIF_TEST: %@", productMode);
  
  [KIFUITestActor setDefaultTimeout:20];

}

-(void)test_TX_History{
  
  [tester waitForViewWithAccessibilityLabel:ktrusteewalletHomeScreenAccessibilityLabel];
  
  [tester waitForViewWithAccessibilityLabel:@"USDT"];
  
  [tester tapViewWithAccessibilityLabel:@"USDT"];
  
  [tester waitForViewWithAccessibilityLabel:@"USDT"];
  
  [tester waitForViewWithAccessibilityLabel:@"LOGO_GRAY_IMAGE"];
  
  NSLog(@" ==================== Finished! ==================== ");
  
}

@end
