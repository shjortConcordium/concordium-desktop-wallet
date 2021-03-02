pipeline {
    agent none
    environment {
        S3_BUCKET = 's3://desktopwallet.concordium.com'
    }
    stages {
        stage('ecr-login') {
            agent { label 'jenkins-worker' }
            steps {
                sh 'aws ecr get-login-password \
                        --region eu-west-1 \
                    | docker login \
                        --username AWS \
                        --password-stdin 192549843005.dkr.ecr.eu-west-1.amazonaws.com'
            }
        }
        stage('precheck') {
            agent { label 'jenkins-worker' }
            steps {
                sh '''\
                    # Extract version number if not set as parameter
                    CARGO_VERSION=$(awk '/version = / { print substr($3, 2, length($3)-2); exit }' Cargo.toml)
                    [ -z "$VERSION" ] && VERSION=$CARGO_VERSION

                    # Prepare filenames
                    FILENAME_DEB="concordium-desktop-wallet_${CARGO_VERSION}_amd64.deb"
                    OUT_FILENAME_DEB="${FILENAME_DEB/$CARGO_VERSION/$VERSION}"

                    FILENAME_RPM="concordium-desktop-wallet-${CARGO_VERSION}.x86_64.rpm"
                    OUT_FILENAME_RPM="${FILENAME_RPM/$CARGO_VERSION/$VERSION}"

                    FILENAME_APPIMAGE="Concordium Wallet-${CARGO_VERSION}.AppImage"
                    OUT_FILENAME_APPIMAGE="${FILENAME_APPIMAGE/$CARGO_VERSION/$VERSION}"

                    check_uniqueness() {
                        # Fail if file already exists
                        totalFoundObjects=$(aws s3 ls "${S3_BUCKET}/$1" --summarize | grep "Total Objects: " | sed 's/[^0-9]*//g')
                        if [ "$totalFoundObjects" -ne "0" ]; then
                            echo "${S3_BUCKET}/$1 already exists"
                            false
                        fi
                    }
                    
                    check_uniqueness "${OUT_FILENAME_DEB}"
                    check_uniqueness "${OUT_FILENAME_RPM}"
                    check_uniqueness "${OUT_FILENAME_APPIMAGE}"
                '''.stripIndent()
            }
        }
        stage('build') {
            agent { 
                docker {
                    label 'jenkins-worker'
                    image 'concordium/desktop-wallet-ci:latest' 
                    registryUrl 'https://192549843005.dkr.ecr.eu-west-1.amazonaws.com/'
                    args '-u root'
                } 
            }
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
                stash includes: 'release/**/*', name: 'release'
            }
            post {
                cleanup {
                    sh '''\
                        # Docker image has to run as root, otherwise user dosen't have access to node
                        # this means all generated files a owned by root, in workdir mounted from host
                        # meaning jenkins can't clean the files, so set owner of all files to jenkins
                        chown -R 1000:1000 .
                    '''.stripIndent()
                }
            }
        }
        stage('Publish') {
            agent { label 'jenkins-worker' }
            steps {
                unstash 'release'
                sh '''\
                    # Extract version number if not set as parameter
                    CARGO_VERSION=$(awk '/version = / { print substr($3, 2, length($3)-2); exit }' Cargo.toml)
                    [ -z "$VERSION" ] && VERSION=$CARGO_VERSION
                    
                    # Prepare filenames
                    FILENAME_DEB="concordium-desktop-wallet_${CARGO_VERSION}_amd64.deb"
                    OUT_FILENAME_DEB="${FILENAME_DEB/$CARGO_VERSION/$VERSION}"

                    FILENAME_RPM="concordium-desktop-wallet-${CARGO_VERSION}.x86_64.rpm"
                    OUT_FILENAME_RPM="${FILENAME_RPM/$CARGO_VERSION/$VERSION}"

                    FILENAME_APPIMAGE="Concordium Wallet-${CARGO_VERSION}.AppImage"
                    OUT_FILENAME_APPIMAGE="${FILENAME_APPIMAGE/$CARGO_VERSION/$VERSION}"
                    
                    # Push to s3
                    aws s3 cp "release/${FILENAME_DEB}" "${S3_BUCKET}/${OUT_FILENAME_DEB}" --grants read=uri=http://acs.amazonaws.com/groups/global/AllUsers
                    aws s3 cp "release/${FILENAME_RPM}" "${S3_BUCKET}/${OUT_FILENAME_RPM}" --grants read=uri=http://acs.amazonaws.com/groups/global/AllUsers
                    aws s3 cp "release/${FILENAME_APPIMAGE}" "${S3_BUCKET}/${OUT_FILENAME_APPIMAGE}" --grants read=uri=http://acs.amazonaws.com/groups/global/AllUsers
                '''.stripIndent()
            }
        }
    }
}