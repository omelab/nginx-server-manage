```yml
stages:
  - deploy

variables:
  IMAGE_NAME: nestjs-app:latest

deploy:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache openssh-client git
  script:
    # Debug: Show what we're doing
    - echo "Setting up SSH..."
    - mkdir -p ~/.ssh
    - chmod 700 ~/.ssh
    - echo "Creating SSH key file..."
    - echo "$SSH_PRIVATE_KEY" > ~/.ssh/id_rsa
    - chmod 600 ~/.ssh/id_rsa
    - echo "Key file created, checking contents..."
    - ls -la ~/.ssh/
    - echo "First few chars of key:"
    - head -c 100 ~/.ssh/id_rsa
    
    # Add known hosts
    - ssh-keyscan -H 103.189.5.21 >> ~/.ssh/known_hosts
    
    # Test with verbose output
    - echo "Testing SSH connection..."
    - ssh -vvv -o BatchMode=yes -o StrictHostKeyChecking=no -i ~/.ssh/id_rsa easy@103.189.5.21 "echo 'SSH SUCCESS'" || echo "SSH failed"
  only:
    - main
```

