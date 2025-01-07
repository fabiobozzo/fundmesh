import { ProjectCreated } from '../generated/ProjectFactory/ProjectFactory'
import { Project } from '../generated/schema'
import { json, ipfs, JSONValue, BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'
import { Project as ProjectTemplate } from '../generated/templates'

export function handleProjectCreated(event: ProjectCreated): void {
  log.info('New project created. Address: {}, Owner: {}, CID: {}', [
    event.params.projectAddress.toHexString(),
    event.params.owner.toHexString(),
    event.params.cid
  ])

  let project = new Project(event.params.projectAddress.toHexString())
  project.projectAddress = event.params.projectAddress
  project.owner = event.params.owner
  project.cid = event.params.cid
  project.createdAt = event.params.timestamp

  // Default values in case IPFS fetch fails
  project.name = ''
  project.description = ''
  project.imageCid = ''

  // Fetch metadata from IPFS
  let ipfsData = ipfs.cat(event.params.cid + '/properties.json')
  if (ipfsData) {
    log.info('IPFS data fetched successfully for {}', [event.params.cid])
    let metadata = json.fromBytes(ipfsData).toObject()
    
    let name = metadata.get('name')
    let description = metadata.get('description')
    let imageCid = metadata.get('imageCid')

    log.info('Parsed metadata - name: {}, description: {}, imageCid: {}', [
      name ? name.toString() : 'null',
      description ? description.toString() : 'null',
      imageCid ? imageCid.toString() : 'null'
    ])

    if (name && !name.isNull()) {
      project.name = name.toString()
    }
    if (description && !description.isNull()) {
      project.description = description.toString()
    }
    if (imageCid && !imageCid.isNull()) {
      project.imageCid = imageCid.toString()
      log.info('Setting imageCid to: {}', [imageCid.toString()])
    }
  } else {
    log.warning('Failed to fetch IPFS data for {}', [event.params.cid])
  }

  // Initialize trending metrics
  project.contributorsCount = BigInt.fromI32(0)
  project.currentBalance = BigInt.fromI32(0)
  project.minimumContribution = event.params.minimumContribution
  project.targetContribution = event.params.targetContribution
  project.deadline = event.params.deadline
  project.progressRatio = BigDecimal.fromString('0')
  project.trendingScore = BigDecimal.fromString('0')
  project.completed = false

  // Create template instance to track this project's events
  ProjectTemplate.create(event.params.projectAddress)

  project.save()
  log.info('Project saved. ID: {}, Name: {}, ImageCid: {}', [
    project.id,
    project.name,
    project.imageCid
  ])
}
