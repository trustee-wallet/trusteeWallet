## BUILD AND DEPLOY


Just add special commands to commit message


[flightalpha] 


[flightbeta] 


Also if you are closing issues - add #issue_number tag in the commit message


## DB should be updated only in DEV branch

[DB init structure](./app/appstores/DataSource/DB/DBInit/assets/dbTableQueries.js)

[DB update structure](./app/appstores/DataSource/DB/DBInit/assets/dbTableUpdateQueries.js)

## How to

[How to Install](./__docs__/how_to_install.md)

[How to Run Android](./__docs__/how_to_run_android.md)

[How to Run IOS](./__docs__/how_to_run_ios.md)

[How to see errors](./__docs__/errors_handling_and_informing.md)

### Stupid errors check

jest 


### get submodules

git submodule sync --recursive  
git submodule update --init --recursive --remote

# for Windows 10 to get symlinks working  
  make sure you installed [Git]https://gitforwindows.org/ with enabled symbolik links  
  according to this [instructions](https://stackoverflow.com/a/52097145/11195554)  
  
  To fix symlinks: after submodules initialization run the following two commands from "Git Bash" console  
    find -type l -delete  
    git reset --hard  


### files moved to submodules

__docs__ moved to 'walletinternals/__docs__'.   
and created symlink '__docs__' pointed to new location  
  
__tests__ moved to submodule. New repository -> /Trustee/wallettests.git  
  
__mocks__ moved inside '__tests__' submodule.  
and created symlink '__mocks__' pointed to new location '__tests__/__mocks__'  

test
