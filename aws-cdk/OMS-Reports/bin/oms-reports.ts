#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { OmsReportsStack } from '../lib/oms-reports-stack';

const app = new cdk.App();
new OmsReportsStack(app, 'OmsReportsStack');
