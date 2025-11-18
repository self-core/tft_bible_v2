pipeline {
    agent any

    environment {
        DOCKER_IMAGE_NAME = 'tft-bible'
        DOCKER_REGISTRY = 'localhost:5000' // Replace with your registry
        NAMESPACE = 'tft-bible'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Backend') {
            steps {
                dir('backend') {
                    script {
                        // Build the backend Docker image
                        docker.build("${env.DOCKER_IMAGE_NAME}-backend", "--build-arg BUILDKIT_INLINE_CACHE=1 -f Dockerfile .")
                    }
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    script {
                        // Build the frontend Docker image
                        docker.build("${env.DOCKER_IMAGE_NAME}-frontend", "--build-arg BUILDKIT_INLINE_CACHE=1 -f Dockerfile .")
                    }
                }
            }
        }

        stage('Run Tests') {
            parallel {
                stage('Backend Tests') {
                    steps {
                        dir('backend') {
                            sh '''
                                docker run --rm \
                                -v ${PWD}:/app \
                                -w /app \
                                rust:1.90-slim \
                                sh -c "cargo test --verbose"
                            '''
                        }
                    }
                }
                stage('Frontend Tests') {
                    steps {
                        dir('frontend') {
                            sh '''
                                docker run --rm \
                                -v ${PWD}:/app \
                                -w /app \
                                node:20-alpine \
                                sh -c "npm install && npm test"
                            '''
                        }
                    }
                }
            }
        }

        stage('Security Scan') {
            steps {
                script {
                    // Run security scans on both images
                    sh 'docker scan ${env.DOCKER_IMAGE_NAME}-backend || true'
                    sh 'docker scan ${env.DOCKER_IMAGE_NAME}-frontend || true'
                }
            }
        }

        stage('Build and Push Images') {
            when {
                branch 'main'
            }
            steps {
                script {
                    // Build and push images to registry
                    docker.withRegistry("http://${env.DOCKER_REGISTRY}", 'docker-registry-credentials') {
                        docker.image("${env.DOCKER_IMAGE_NAME}-backend").push("latest")
                        docker.image("${env.DOCKER_IMAGE_NAME}-frontend").push("latest")
                    }
                }
            }
        }

        stage('Deploy to Dev') {
            when {
                branch 'main'
            }
            steps {
                script {
                    // Deploy to development environment
                    sh '''
                        docker-compose -f docker-compose.yml up -d --build
                    '''
                }
            }
        }

        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                script {
                    timeout(time: 10, unit: 'MINUTES') {
                        input message: 'Deploy to production?', ok: 'Deploy'
                    }
                    
                    // Update production deployment
                    sh '''
                        # This would typically update a production environment
                        # For example, using kubectl or docker swarm
                        # kubectl set image deployment/backend-deployment backend=${env.DOCKER_REGISTRY}/${env.DOCKER_IMAGE_NAME}-backend:latest
                        # kubectl set image deployment/frontend-deployment frontend=${env.DOCKER_REGISTRY}/${env.DOCKER_IMAGE_NAME}-frontend:latest
                    '''
                }
            }
        }
    }

    post {
        always {
            // Clean up temporary images
            sh 'docker system prune -f'
        }
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}