const path = require('path')
const { readdir, lstatSync, readFile } = require('fs')

const AWS = require('aws-sdk')
const dotenv = require('dotenv')
const minimist = require('minimist')
const mime = require('mime')
const slash = require('slash')
const chalk = require('chalk')

dotenv.config()

const args = minimist(process.argv.slice(2), {
  string: ['env', 'bucket'],
  alias: {
    b: 'bucket',
    e: 'env'
  },
  default: {
    env: 'development'
  }
})

const s3 = new AWS.S3()

let bucket = args.bucket
const distFolderPath = path.join('./dist/')

if (!bucket) return console.log(chalk.red('You must specify a', chalk.underline('bucket')))
console.log(chalk.green('deploying to', bucket))

const uploadItems = (dir) => {
  readdir(dir, (err, files) => {
    if (err) {
      console.error('readdir', err)
      return
    }
    if (!files || files.length === 0) {
      console.log('directory is empty')
      return
    }

    files.map((filename) => {
      const filePath = path.join(dir, filename)
      if (lstatSync(filePath).isDirectory()) {
        return uploadItems(filePath)
      }

      return readFile(filePath, (error, fileContent) => {
        if (error) throw error
        const file = filePath.replace(distFolderPath, '')

        const bucketFile = slash(file)
        s3.putObject({
          Bucket: bucket,
          Key: bucketFile,
          Body: fileContent,
          ContentType: mime.getType(filePath)
        }, err => {
          if (err) throw err
          console.log('successfully uploaded', file)
        })
      })
    })
  })
}

uploadItems(distFolderPath)
