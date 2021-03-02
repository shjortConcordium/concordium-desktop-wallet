pipeline {
    agent none
    environment {
        S3_BUCKET = 's3://desktopwallet.concordium.com'
    }
    stages {
        stage('precheck') {
            agent { label 'jenkins-worker' }
            steps {
                sh '''\
                    # Extract version number if not set as parameter
                    [ -z "$VERSION" ] && VERSION=$(awk '/version = / { print substr($3, 2, length($3)-2); exit }' Cargo.toml)
                    FILENAME_DMG="Concordium Wallet-${VERSION}.dmg"
                    
                    # Fail if file already exists
                    check_uniqueness() {
                        # Fail if file already exists
                        totalFoundObjects=$(aws s3 ls "${S3_BUCKET}/$1" --summarize | grep "Total Objects: " | sed 's/[^0-9]*//g')
                        if [ "$totalFoundObjects" -ne "0" ]; then
                            echo "${S3_BUCKET}/$1 already exists"
                            false
                        fi
                    }

                    check_uniqueness "${FILENAME_DMG}"
                '''.stripIndent()
            }
        }
        stage('build') {
            agent { label 'mac' }
            steps {
                sh '''\
                    # Print system info
                    node --version
                    npm --version
                    yarn --version
                    python --version
                    rustup show
                    wasm-pack --version

                    # Install dependencies
                    yarn

                    # Build
                    yarn package
                '''.stripIndent()
                stash includes: 'release/Concordium Wallet-*.dmg', name: 'releaseDMG'
            }
        }
        stage('Publish') {
            agent { label 'jenkins-worker' }
            steps {
                unstash 'releaseDMG'
                sh '''\
                    # Extract version number if not set as parameter
                    CARGO_VERSION=$(awk '/version = / { print substr($3, 2, length($3)-2); exit }' Cargo.toml)
                    [ -z "$VERSION" ] && VERSION=$CARGO_VERSION

                    #Prepare filenames
                    FILENAME_DMG="Concordium Wallet-${CARGO_VERSION}.dmg"
                    OUT_FILENAME_DMG="${FILENAME_DMG/$CARGO_VERSION/$VERSION}"
                    
                    # Push to s3
                    aws s3 cp "release/${FILENAME_DMG}" "${S3_BUCKET}/${OUT_FILENAME_DMG}" --grants read=uri=http://acs.amazonaws.com/groups/global/AllUsers
                '''.stripIndent()
            }
        }
    }
}