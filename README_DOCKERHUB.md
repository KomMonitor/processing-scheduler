# KomMonitor Processing Scheduler
This NodeJS project is part of the [KomMonitor](http://kommonitor.de) spatial data infrastructure and periodocally detects computable indicator timestamps whose computation is then triggered by calling the **Processing Engine**. 

## Quick Links And Further Information on KomMonitor
   - [DockerHub repositories of KomMonitor Stack](https://hub.docker.com/orgs/kommonitor/repositories)
   - [Github Repositories of KomMonitor Stack](https://github.com/KomMonitor)
   - [Github Wiki for KomMonitor Guidance and central Documentation](https://github.com/KomMonitor/KomMonitor-Docs/wiki)
   - [Technical Guidance](https://github.com/KomMonitor/KomMonitor-Docs/wiki/Technische-Dokumentation) and [Deployment Information](https://github.com/KomMonitor/KomMonitor-Docs/wiki/Setup-Guide) for complete KomMonitor stack on Github Wiki
   - [KomMonitor Website](https://kommonitor.de/) 

## Overview
The **Processing Scheduler** is implemented as a NodeJS application. The KomMonitor stack allows the automatic computation of *target indicators* from base indicators and/or other georesources. The scheduler's main task hereby is to **periodically scan** the respective KomMonitor resource metadata in order to find any *target indicator time series elements* whose computation can be triggered. I.e., if base population indicator time series data is updated once per year, then derived indicators like share of male and female population can be comuted automatically within KomMonitor. As soon as a new timestamp is added to the base population indicators, the scheduler detects that for the derived share indicators the new timestamp can be computed by the system.

Hereby, the **KomMonitor Scheduler** it consumes various data (i.e. script resources, indicator and georesource timeseries metadata) from the **KomMonitor Data Management** component to find computable indicators, compare their timeseries to the timeseries of required base data (base indcators and/or georesources) and trigger the computation of missing target indicator timeseries elements. For this purpose computation requests against the **Processing Engine** are generated and sent, whose results will be stored within the KomMonitor database via **KomMonitor Data Managment** component.

**Preconditions are:**

   1. *base indicator* (for one or more spatial units) or base georesource data must be loaded into KomMonitor   
   2. *target indicator metadata* must be integrated into KomMonitor with the setting `creationType=COMPUTATION` (be computed by KomMonitor).
   3. *script* resource must be defined for the new target indicator specifying the computation workflow and necessary input data as well as process parameters

Based on these information, the scheduler may perform its task.

### Future Improvement Ideas
Currently the **Processing Scheduler** performs quite simple periodical scans to detect and trigger the computations of missing target indicator timestamps. This has some limitations. Amongst others:

   - If indicator data for any spatial unit could not be computed, it might not be retriggered. 
   - Although the scan interval can be configured, users must still wait for computations to be triggered by the **Processing Scheduler**.
   - no indicator specific computation settings can be applied. Instead the scheduler works with global parameters affecting all processed data in the same manner

Ideas to improve the **Processing Scheduler** could be: 

   - enhance the scheduler to a REST service offering several endpoints for more fine-granular on-demand trigger/scan actions, such as 
      - `/scan/all`: trigger a complete scan of all resource data (similar to defaut behaviour but receive command via REST interface) 
      - `/scan/target-indicator/{targetIndicatorId}?enforceRecomputation=true`: trigger scan of only certain target indicator resource data; optionally enforce recomputation of all possible timeseries elements to (re-)compute all timeseries elements for all possible spatial units 
      - `/scan/base-indicator/{baseIndicatorId}?enforceRecomputation=true`: trigger scan of all existing target indicator resource data where the submitted baseIndicator is a computation resource; optionally enforce recomputation of all possible timeseries elements to (re-)compute all timeseries elements for all possible spatial units 
      - `/scan/base-georesource/{baseGeoresourceId}?enforceRecomputation=true`: trigger scan of all existing target indicator resource data where the submitted baseGeoresource is a computation resource; optionally enforce recomputation of all possible timeseries elements to (re-)compute all timeseries elements for all possible spatial units 
      - ... and maybe more REST endpoints 
   - or mabe enrich whole KomMonitor stack with event-based message broker mechanism to let the scheduler receive any indicator/georesource feature updates events and perform a scan of any derived target indicators.

## Dependencies to other KomMonitor Components
KomMonitor Processing Scheduler requires 
   - a running instance of KomMonitor **Data Management** for main data retrieval
   - a running instance of **Processing Engine** to trigger the computaton of target indicator timeseries elements for various spatial units
   - an optional and configurable connection to a running **Keycloak** server, if role-based data access is activated via configuration of KomMonitor stack


## Exemplar docker-compose File with explanatory comments

Only contains subset of whole KomMonitor stack to focus on the config parameters of this component

```yml

version: '2.1'

networks:
  kommonitor:
      name: kommonitor

services:

    # for special scenarios multiple processing schedulers could be deployed - i.e. in combination with individual processing engines
    kommonitor-processing-scheduler:     # scheduler periodically performs scans of KomMonitor resources to find and trigger computations for missing but computable indicator time-series elements 
      image: 'kommonitor/processing-scheduler'
      container_name: kommonitor-processing-scheduler
      networks:
       - kommonitor
      depends_on:
       - kommonitor-processing-engine
       - kommonitor-data-management
      environment:
       - KOMMONITOR_DATA_MANAGEMENT_URL=http://kommonitor-data-management:8085/management      # URL to Data Management service; use docker name and port within same network if possible
       - KOMMONITOR_PROCESSING_ENGINE_URL=http://kommonitor-processing-engine:8086/processing  # URL to Processing Engine service; use docker name and port within same network if possible
       - CRON_PATTERN_FOR_SCHEDULING=*/30 * * * *     # CRON pattern (refer to https://www.npmjs.com/package/node-cron) for periodic scheduler triggering to initialize missing indicator time-series elements  
       - SETTING_AGGREGATE_SPATIAL_UNITS=false    # default false; global setting whether the computed indictor values from the hierarchically lowest spatial unit shall be aggregated to hierarchically higher spatial units (true) or if each spatial unit shall be computed own their own (false - required that base data is available on the resprctive spatial units)
       - TRIGGER_COMPUTATION_OF_PAST_TIMESTAMPS_OVERWRITING_EXISTING_VALUES=false   # boolean global setting to let scheduler retrigger already computed indicator time-series elements for a certain period in time; good for use cases where historic base data is changed due to new facts, and indicator data - computed from that base data - must be recomputed; applies globally to all computed indicators currently  
       - NUMBER_OF_DAYS_FOR_OVERWRITING_EXISTING_VALUES=7   # number of days within the past to recompute indicator time series values - only relevant if TRIGGER_COMPUTATION_OF_PAST_TIMESTAMPS_OVERWRITING_EXISTING_VALUES=true
       - DISABLE_LOGS=false         # optionally disable any console logs
       - USE_LATEST_POSSIBLE_BASE_INDICATOR_DATE_INSTEAD_OF_COMMON_DATE=true   # # if set to true, then the last possible timestamp from any baseIndicator is used; i.e. if there are two base indicators A and B where lastTimestamp(A)=2019-12-31 and lastTimestamp(B)=2020-06-31, then 2020-06-31 is used; if set to false, then 2019-12-31 will be used instead (as this is the latest "common" date across all baseIndicators) 
       - ENCRYPTION_ENABLED=false       # enable/disable encrypted data retrieval from Data Management service
       - ENCRYPTION_PASSWORD=password   # shared secret for data encryption - must be set equally within all supporting components
       - ENCRYPTION_IV_LENGTH_BYTE=16   # length of random initialization vector for encryption algorithm - must be set equally within all supporting components
       - KEYCLOAK_ENABLED=false                                       # enable/disable role-based data access using Keycloak
       - KEYCLOAK_REALM=kommonitor                                    # Keycloak realm name
       - KEYCLOAK_AUTH_SERVER_URL=https://keycloak.fbg-hsbo.de/auth/  # Keycloak URL ending with "/auth/"
       - KEYCLOAK_SSL_REQUIRED=external                               # Keycloak SSL setting; ["external", "none"]; default "external"
       - KEYCLOAK_RESOURCE=kommonitor-processing-scheduler            # Keycloak client/resource name
       - KEYCLOAK_PUBLIC_CLIENT=true                                  # Keycloak setting is public client - should be true
       - KEYCLOAK_CONFIDENTIAL_PORT=0                                 # Keycloak setting confidential port - default is 0
       - KEYCLOAK_ADMIN_RIGHTS_USER_NAME=scheduler                    # Keycloak internal user name within kommonitor-realm that has administrator role associated in order to grant rigths to fetch all data 
       - KEYCLOAK_ADMIN_RIGHTS_USER_PASSWORD=scheduler                # Keycloak internal user password within kommonitor-realm that has administrator role associated in order to grant rigths to fetch all data


  # redis databse required for processing engine to store indicator computation job status
    redis:
      image: redis:alpine
      container_name: redis
      #restart: unless-stopped
      networks:
      - kommonitor

    # for special scenarios multiple processing engines could be deployed - i.e. in combination with individual processing schedulers
    kommonitor-processing-engine:         # perfoms script-based computation of indicators based on other (base-)indicators and/or georesources for target spatial units
      image: 'kommonitor/processing-engine'
      container_name: kommonitor-processing-engine
      #restart: unless-stopped
      ports:
       - "8086:8086"
      networks:
       - kommonitor
      volumes:
       - processing_jobstatus:/code/tmp    # persist tmp computation status files on disk
      depends_on:
       - redis
      environment:
       - REDIS_HOST=redis    # use docker name if possible; else IP 
       - REDIS_PORT=6379     # running redis port
       - KOMMONITOR_DATA_MANAGEMENT_URL=http://kommonitor-data-management:8085/management    # URL to Data Management service; use docker name and port if possible
       - GEOMETRY_SIMPLIFICATION_PARAMETER_NAME=simplifyGeometries   # paramter to query geometries from Data Management component 
       - GEOMETRY_SIMPLIFICATION_PARAMETER_VALUE=original            # values are ["original", "weak", "medium", "strong"] from weak to strong the geometries are more simplified (reducing size)
       - FEATURE_ID_PROPERTY_NAME=ID       # KomMonitor wide setting, which property contains feature ID values - best not be changed
       - FEATURE_NAME_PROPERTY_NAME=NAME   # KomMonitor wide setting, which property contains feature NAME values - best not be changed
       - OPEN_ROUTE_SERVICE_URL=https://ors5.fbg-hsbo.de    # URL to Open Route Service instance (currently version 5 is supported)
       - DISABLE_LOGS=false          # optionally diable any console log
       - MAX_NUMBER_OF_TARGET_DATES_PER_PUT_REQUEST=45   # setting to split up computed indicator results import/update requests; each request has the specified maximum number of indicator timestamps 
       - ENCRYPTION_ENABLED=false       # enable/disable encrypted data retrieval from Data Management service
       - ENCRYPTION_PASSWORD=password   # shared secret for data encryption - must be set equally within all supporting components
       - ENCRYPTION_IV_LENGTH_BYTE=16   # length of random initialization vector for encryption algorithm - must be set equally within all supporting components
       - KEYCLOAK_ENABLED=false                                       # enable/disable role-based data access using Keycloak
       - KEYCLOAK_REALM=kommonitor                                    # Keycloak realm name
       - KEYCLOAK_AUTH_SERVER_URL=https://keycloak.fbg-hsbo.de/auth/  # Keycloak URL ending with "/auth/"
       - KEYCLOAK_SSL_REQUIRED=external                               # Keycloak SSL setting; ["external", "none"]; default "external"
       - KEYCLOAK_RESOURCE=kommonitor-processing-engine               # Keycloak client/resource name
       - KEYCLOAK_PUBLIC_CLIENT=true                                  # Keycloak setting is public client - should be true
       - KEYCLOAK_CONFIDENTIAL_PORT=0                                 # Keycloak setting confidential port - default is 0
       - KEYCLOAK_ADMIN_RIGHTS_USER_NAME=processor                    # Keycloak internal user name within kommonitor-realm that has administrator role associated in order to grant rigths to fetch all data 
       - KEYCLOAK_ADMIN_RIGHTS_USER_PASSWORD=processor                # Keycloak internal user password within kommonitor-realm that has administrator role associated in order to grant rigths to fetch all data

    # database container; must use PostGIS database
    # database is not required to run in docker - will be configured in Data Management component
    kommonitor-db:
      image: mdillon/postgis
      container_name: kommonitor-db
      #restart: unless-stopped
      ports:
        - 5432:5432
      environment:
        - POSTGRES_USER=kommonitor      # database user (will be created on startup if not exists) - same settings in data management service
        - POSTGRES_PASSWORD=kommonitor  # database password (will be created on startup if not exists) - same settings in data management service 
        - POSTGRES_DB=kommonitor_data   # database name (will be created on startup if not exists) - same settings in data management service
      volumes:
        - postgres_data:/var/lib/postgresql/data   # persist database data on disk (crucial for compose down calls to let data survive)
      networks:
        - kommonitor

    # Data Management component encapsulating the database access and management as REST service
    kommonitor-data-management:
      image: kommonitor/data-management
      container_name: kommonitor-data-management
      #restart: unless-stopped
      depends_on:
        - kommonitor-db    # only if database runs as docker container as well
      ports:
        - "8085:8085"
      networks:
        - kommonitor
      links:
        - kommonitor-db
      environment:
       # omitted here for brevity

volumes:
 processing_jobstatus:
 postgres_data:

```

## Contact
|    Name   |   Organization    |    Mail    |
| :-------------: |:-------------:| :-----:|
| Christian Danowski-Buhren | Bochum University of Applied Sciences | christian.danowski-buhren@hs-bochum.de |
| Andreas Wytzisk  | Bochum University of Applied Sciences | Andreas-Wytzisk@hs-bochum.de |

## Credits and Contributing Organizations
- Department of Geodesy, Bochum University of Applied Sciences
- Department for Cadastre and Geoinformation, Essen
- Department for Geodata Management, Surveying, Cadastre and Housing Promotion, Mülheim an der Ruhr
- Department of Geography, Ruhr University of Bochum
- 52°North GmbH, Münster
- Kreis Recklinghausen
