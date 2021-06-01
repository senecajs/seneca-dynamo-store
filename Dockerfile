FROM debian:buster

# Installing basic utilities that will be required by aws-cli and dynamodb-local
#
RUN apt-get update
RUN apt-get install coreutils
RUN apt-get install bash

# Installing Java. We will need Java to run amazon/dynamodb-local
#
RUN apt-get install -y openjdk-11-jdk

# Installing aws-cli
#
RUN apt-get install -y \
        python3 \
        python3-pip \
    && pip3 install --upgrade pip \
    && pip3 install \
        awscli

WORKDIR /home

# Installing amazon/dynamodb-local
#
RUN apt-get install -y wget && apt-get install -y ca-certificates && \
    wget -O /tmp/dynamodb_local_latest https://s3-us-west-2.amazonaws.com/dynamodb-local/dynamodb_local_latest.tar.gz && \
    tar xfz /tmp/dynamodb_local_latest && \
    apt-get install --reinstall -y ca-certificates && \
    rm -f /tmp/dynamodb_local_latest

# Before amazon/dynamodb-local can be run, an AWS profile (albeit a dummy one)
# must be configured.
#
ENV LOCALTEST_AWS_ACCESS_KEY_ID='none'
ENV LOCALTEST_AWS_SECRET_ACCESS_KEY='none'
ENV LOCALTEST_DEFAULT_REGION='region'
ENV LOCALTEST_OUTPUT_FORMAT='json'
#
RUN echo -ne "${LOCALTEST_AWS_ACCESS_KEY_ID}\n${LOCALTEST_AWS_SECRET_ACCESS_KEY}\n${LOCALTEST_DEFAULT_REGION}\n${LOCALTEST_OUTPUT_FORMAT}\n" | aws configure --profile localtest


EXPOSE 8000

# Run the amazon/dynamodb-local instance.
#
CMD java -Djava.library.path=. -jar DynamoDBLocal.jar --sharedDb --port 8000 --inMemory

